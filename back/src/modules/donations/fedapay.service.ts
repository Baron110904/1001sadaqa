import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { Donation } from '@prisma/client';
import type { PaymentConfig } from '../settings/settings.service';

/**
 * Appel à FedaPay, l'agrégateur retenu par l'association.
 *
 * Deux temps, comme l'impose leur API : on crée la transaction, puis on
 * envoie le donateur sur la page de règlement qu'elle porte. La création
 * renvoie déjà un `payment_url` ; l'appel à `/token` reste en recours, car
 * rien dans leur documentation ne garantit la présence du premier.
 *
 * La clé secrète ne quitte jamais le serveur : c'est lui qui parle à FedaPay,
 * le navigateur ne reçoit qu'une adresse de redirection.
 */

const BASE_BAC_A_SABLE = 'https://sandbox-api.fedapay.com/v1';
const BASE_REEL = 'https://api.fedapay.com/v1';

/** Délai au-delà duquel on cesse d'attendre FedaPay, en millisecondes. */
const DELAI = 15_000;

/** Fenêtre d'acceptation d'un webhook, en secondes. Valeur de leur SDK. */
const TOLERANCE_SECONDES = 300;

/**
 * États d'une transaction FedaPay.
 *
 * `approved` est le seul qui vaut encaissement. « canceled » et « declined »
 * ne sont pas définitifs chez eux — le donateur peut retenter — on les laisse
 * donc en attente plutôt que de clore le don.
 */
export type EtatFedapay =
  | 'pending'
  | 'approved'
  | 'declined'
  | 'canceled'
  | 'refunded'
  | 'transferred'
  | 'expired';

interface TransactionFedapay {
  id: number;
  status: EtatFedapay;
  payment_url?: string;
}

@Injectable()
export class FedapayService {
  private readonly journal = new Logger(FedapayService.name);

  /**
   * Crée la transaction et renvoie l'adresse de règlement.
   *
   * `retourUrl` porte l'identifiant de notre don : au retour, on retrouve la
   * ligne sans dépendre des paramètres que FedaPay ajoute à l'adresse, dont
   * le nom n'est pas contractuel.
   */
  async ouvrirPaiement(
    don: Donation,
    config: PaymentConfig,
    retourUrl: string,
  ): Promise<{ url: string; reference: string }> {
    const [prenom, ...reste] = don.donorName.split(' ');

    const transaction = await this.appeler<{ 'v1/transaction': TransactionFedapay }>(
      config,
      'POST',
      '/transactions',
      {
        description: `Don à 1001 SADAQA - ${don.id}`,
        amount: Math.round(don.amount),
        currency: { iso: don.currency },
        callback_url: retourUrl,
        merchant_reference: don.id,
        customer: {
          firstname: prenom || 'Donateur',
          lastname: reste.join(' ') || '-',
          email: don.donorEmail,
        },
      },
    );

    const creee = transaction['v1/transaction'];
    const url = creee.payment_url ?? (await this.lienDeSecours(config, creee.id));

    return { url, reference: String(creee.id) };
  }

  /** État courant d'une transaction, demandé à FedaPay et non au navigateur. */
  async etatDe(config: PaymentConfig, reference: string): Promise<EtatFedapay> {
    const reponse = await this.appeler<{ 'v1/transaction': TransactionFedapay }>(
      config,
      'GET',
      `/transactions/${reference}`,
    );
    return reponse['v1/transaction'].status;
  }

  /**
   * Vérifie la signature d'un webhook FedaPay.
   *
   * Schéma repris de leur SDK (`src/Webhook.ts`) : l'en-tête vaut
   * `t=<horodatage>,s=<empreinte>`, et l'empreinte est le HMAC-SHA256 de
   * « horodatage.corps » avec le secret du webhook. La comparaison est faite
   * en temps constant — une comparaison ordinaire laisse deviner l'empreinte
   * octet par octet.
   *
   * L'horodatage est vérifié dans une fenêtre de cinq minutes, faute de quoi
   * un message intercepté pourrait être rejoué indéfiniment.
   */
  verifierSignature(corpsBrut: string, entete: string | undefined, secret: string): boolean {
    if (!secret || !entete) return false;

    let horodatage = -1;
    const empreintes: string[] = [];

    for (const morceau of entete.split(',')) {
      const [cle, valeur] = morceau.split('=');
      if (cle === 't') horodatage = Number.parseInt(valeur, 10);
      if (cle === 's' && valeur) empreintes.push(valeur);
    }

    if (!Number.isFinite(horodatage) || horodatage < 0 || empreintes.length === 0) return false;

    const age = Math.abs(Math.floor(Date.now() / 1000) - horodatage);
    if (age > TOLERANCE_SECONDES) return false;

    const attendue = createHmac('sha256', secret)
      .update(`${horodatage}.${corpsBrut}`, 'utf8')
      .digest('hex');

    return empreintes.some((candidate) => {
      const a = Buffer.from(candidate, 'utf8');
      const b = Buffer.from(attendue, 'utf8');
      return a.length === b.length && timingSafeEqual(a, b);
    });
  }

  private async lienDeSecours(config: PaymentConfig, id: number): Promise<string> {
    const jeton = await this.appeler<{ url: string }>(
      config,
      'POST',
      `/transactions/${id}/token`,
    );
    return jeton.url;
  }

  private async appeler<T>(
    config: PaymentConfig,
    methode: 'GET' | 'POST',
    chemin: string,
    corps?: unknown,
  ): Promise<T> {
    if (!config.secretKey) {
      throw new ServiceUnavailableException(
        'Le paiement en ligne est activé mais la clé secrète FedaPay manque.',
      );
    }

    const base = config.sandbox ? BASE_BAC_A_SABLE : BASE_REEL;

    let reponse: Response;
    try {
      reponse = await fetch(`${base}${chemin}`, {
        method: methode,
        headers: {
          Authorization: `Bearer ${config.secretKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: corps ? JSON.stringify(corps) : undefined,
        signal: AbortSignal.timeout(DELAI),
      });
    } catch (cause) {
      // Le don est déjà enregistré : on le dit, plutôt que de laisser le
      // donateur devant une erreur muette.
      this.journal.error(`FedaPay injoignable sur ${methode} ${chemin} : ${String(cause)}`);
      throw new ServiceUnavailableException(
        'Le service de paiement est momentanément injoignable. Votre don est enregistré, nous vous recontactons.',
      );
    }

    const texte = await reponse.text();

    if (!reponse.ok) {
      // Le corps peut contenir des détails utiles au diagnostic ; il ne
      // contient jamais la clé, qui ne voyage que dans l'en-tête.
      this.journal.error(`FedaPay ${reponse.status} sur ${methode} ${chemin} : ${texte.slice(0, 400)}`);
      throw new ServiceUnavailableException(
        'Le service de paiement a refusé la demande. Votre don est enregistré, nous vous recontactons.',
      );
    }

    return JSON.parse(texte) as T;
  }
}
