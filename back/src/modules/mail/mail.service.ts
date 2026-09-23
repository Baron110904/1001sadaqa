import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Envoi de courriels.
 *
 * Le guide exige un accusé de réception à l'expéditeur et une notification
 * interne pour chaque formulaire (§2.5.3), plus les rappels d'échéance de
 * cotisation (§7.4.2).
 *
 * Aucun fournisseur n'est branché à ce stade : les paramètres se saisissent
 * depuis le back-office, comme la passerelle de paiement. Tant qu'ils sont
 * vides, les messages sont **journalisés et non envoyés** — le formulaire
 * fonctionne, l'enregistrement se fait, et rien ne part silencieusement dans le
 * vide en laissant croire le contraire.
 *
 * Pour brancher un fournisseur : renseigner les clés `mail.*` en paramètres,
 * puis implémenter `deliver()` avec le client choisi. Le reste du code appelle
 * déjà `send()` et n'aura pas à changer.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Envoie un message, ou le journalise si le service n'est pas configuré.
   *
   * Ne lève jamais : un courriel qui échoue ne doit pas faire échouer
   * l'enregistrement d'une demande d'adhésion ou d'un don.
   */
  async send(message: MailMessage): Promise<MailOutcome> {
    const config = await this.config();

    if (!config.enabled || !config.host || !config.from) {
      this.logger.log(
        `Courriel non envoyé (service non configuré) — « ${message.subject} » ` +
          `à ${message.to}. Renseignez les paramètres « mail.* » au back-office.`,
      );
      return { sent: false, reason: 'non-configure' };
    }

    try {
      await this.deliver(message, config);
      return { sent: true };
    } catch (erreur) {
      this.logger.warn(
        `Échec d'envoi « ${message.subject} » à ${message.to} : ` +
          (erreur instanceof Error ? erreur.message : String(erreur)),
      );
      return { sent: false, reason: 'echec' };
    }
  }

  /** Accusé de réception à l'expéditeur d'un formulaire. */
  acknowledge(to: string, name: string, kind: FormKind): Promise<MailOutcome> {
    const gabarit = ACKNOWLEDGEMENTS[kind];

    return this.send({
      to,
      subject: gabarit.subject,
      body: gabarit.body(name),
    });
  }

  /** Notification interne au service concerné. */
  async notifyTeam(subject: string, body: string): Promise<MailOutcome> {
    const config = await this.config();
    if (!config.internalTo) return { sent: false, reason: 'non-configure' };

    return this.send({ to: config.internalTo, subject, body });
  }

  /**
   * Remise effective du message.
   *
   * Volontairement vide : c'est le seul endroit à écrire le jour où un
   * fournisseur est choisi. Tout le reste — gabarits, appels, journalisation —
   * est déjà en place.
   */
  private async deliver(_message: MailMessage, _config: MailConfig): Promise<void> {
    throw new Error(
      "Aucun fournisseur d'envoi n'est implémenté. Voir MailService.deliver().",
    );
  }

  private async config(): Promise<MailConfig> {
    const lignes = await this.prisma.setting.findMany({
      where: { key: { startsWith: 'mail.' } },
    });

    const valeurs = Object.fromEntries(lignes.map((l) => [l.key, l.value]));
    const texte = (cle: string): string =>
      typeof valeurs[cle] === 'string' ? (valeurs[cle] as string) : '';

    return {
      enabled: valeurs['mail.enabled'] === true,
      host: texte('mail.host'),
      from: texte('mail.from'),
      internalTo: texte('mail.internalTo'),
    };
  }
}

export interface MailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface MailOutcome {
  sent: boolean;
  reason?: 'non-configure' | 'echec';
}

interface MailConfig {
  enabled: boolean;
  host: string;
  from: string;
  internalTo: string;
}

export type FormKind = 'membre' | 'benevole' | 'partenaire' | 'don' | 'contact';

/**
 * Gabarits des accusés de réception.
 *
 * Chacun annonce la suite du parcours : une personne qui sait ce qui va se
 * passer n'écrit pas trois jours plus tard pour demander si sa demande est
 * arrivée.
 */
const ACKNOWLEDGEMENTS: Record<FormKind, { subject: string; body: (nom: string) => string }> = {
  membre: {
    subject: 'Votre demande d’adhésion à 1001 SADAQA',
    body: (nom) =>
      `Bonjour ${nom},\n\n` +
      'Nous avons bien reçu votre demande d’adhésion. Elle est examinée par ' +
      'l’équipe, et vous recevrez notre réponse par courriel, quelle qu’elle ' +
      'soit.\n\nMerci de votre engagement.\n\n1001 SADAQA',
  },
  benevole: {
    subject: 'Votre candidature de bénévole',
    body: (nom) =>
      `Bonjour ${nom},\n\n` +
      'Votre candidature est enregistrée. Nous étudions votre profil et nous ' +
      'reviendrons vers vous pour vous orienter vers les missions qui ' +
      'correspondent à vos compétences et à vos disponibilités.\n\n1001 SADAQA',
  },
  partenaire: {
    subject: 'Votre demande de partenariat',
    body: (nom) =>
      `Bonjour ${nom},\n\n` +
      'Votre demande de partenariat nous est bien parvenue. Un membre de ' +
      'l’équipe vous contactera pour en discuter.\n\n1001 SADAQA',
  },
  don: {
    subject: 'Merci pour votre don',
    body: (nom) =>
      `Bonjour ${nom},\n\n` +
      'Nous vous remercions pour votre don. Vous recevrez les informations ' +
      'sur l’action qu’il finance.\n\n1001 SADAQA',
  },
  contact: {
    subject: 'Votre message à 1001 SADAQA',
    body: (nom) =>
      `Bonjour ${nom},\n\n` +
      'Votre message est bien arrivé. Nous y répondons sous quelques jours ' +
      'ouvrés.\n\n1001 SADAQA',
  },
};
