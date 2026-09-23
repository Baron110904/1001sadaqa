'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SubmitResult } from '@/lib/api';
import type { DonationReceipt } from '@/lib/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api/v1';

/**
 * Envoie un formulaire à l'API depuis le serveur Next.
 *
 * L'adresse du visiteur est retransmise dans `x-forwarded-for`. Sans cela,
 * l'API ne verrait que l'adresse du serveur Next : la limitation de débit
 * compterait tous les visiteurs comme un seul et bloquerait le formulaire
 * après trois envois pour tout le monde. Côté API, `trust proxy` est activé
 * pour lire cet en-tête.
 *
 * Conséquence de déploiement : l'API ne doit être joignable que par le
 * serveur Next (réseau privé ou pare-feu), sinon cet en-tête devient
 * falsifiable par n'importe qui.
 */
async function submit(path: string, body: unknown): Promise<SubmitResult> {
  const incoming = await headers();
  const clientIp =
    incoming.get('x-forwarded-for') ?? incoming.get('x-real-ip') ?? undefined;

  try {
    const response = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clientIp ? { 'x-forwarded-for': clientIp } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;

    if (!response.ok) {
      if (response.status === 429) {
        return {
          ok: false,
          message: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
        };
      }

      const raw = payload?.message;
      return {
        ok: false,
        message:
          (Array.isArray(raw) ? raw[0] : raw) ?? "L'envoi a échoué. Réessayez dans un instant.",
      };
    }

    return { ok: true, data: payload };
  } catch {
    return {
      ok: false,
      message: 'Le service est momentanément injoignable. Réessayez dans un instant.',
    };
  }
}

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim();
}

function optional(form: FormData, key: string): string | undefined {
  const value = text(form, key);
  return value.length ? value : undefined;
}

// ── Nous contacter ─────────────────────────────────────────────────────────

export async function sendContact(
  _previous: SubmitResult | null,
  form: FormData,
): Promise<SubmitResult> {
  return submit('/contacts', {
    name: text(form, 'name'),
    email: text(form, 'email'),
    phone: optional(form, 'phone'),
    subject: text(form, 'subject'),
    message: text(form, 'message'),
  });
}

// ── Candidature bénévole ───────────────────────────────────────────────────

export async function sendVolunteer(
  _previous: SubmitResult | null,
  form: FormData,
): Promise<SubmitResult> {
  return submit('/volunteers', {
    name: text(form, 'name'),
    email: text(form, 'email'),
    phone: text(form, 'phone'),
    availability: optional(form, 'availability'),
    missionId: optional(form, 'missionId'),
  });
}

// ── Demande de partenariat ─────────────────────────────────────────────────

export async function sendPartnership(
  _previous: SubmitResult | null,
  form: FormData,
): Promise<SubmitResult> {
  return submit('/partners/requests', {
    organisation: text(form, 'organisation'),
    contactName: text(form, 'contactName'),
    email: text(form, 'email'),
    phone: optional(form, 'phone'),
    intent: text(form, 'intent'),
  });
}

// ── Don ────────────────────────────────────────────────────────────────────

export interface DonationState extends SubmitResult {
  receipt?: DonationReceipt;
}

export async function sendDonation(
  _previous: DonationState | null,
  form: FormData,
): Promise<DonationState> {
  const amount = Number(text(form, 'amount'));
  const firstName = text(form, 'firstName');
  const lastName = text(form, 'lastName');

  const result = await submit('/donations', {
    donorName: `${firstName} ${lastName}`.trim(),
    donorEmail: text(form, 'email'),
    donorPhone: optional(form, 'phone'),
    donorCountry: optional(form, 'country'),
    donorCity: optional(form, 'city'),
    amount,
    method: text(form, 'method'),
    frequency: text(form, 'frequency'),
    programId: optional(form, 'programId'),
    isAnonymous: form.get('isAnonymous') === 'on',
  });

  if (!result.ok) return result;

  const receipt = result.data as DonationReceipt;

  // Passerelle active : le donateur part régler chez FedaPay. La redirection
  // se fait ici, côté serveur, plutôt qu'en affichant un écran « vous allez
  // être redirigé » que rien ne suivait.
  //
  // `redirect` lève une exception que Next intercepte : elle doit sortir de
  // l'action, d'où sa place hors de tout `try`.
  if (receipt.gateway.mode === 'online') redirect(receipt.gateway.url);

  return { ...result, receipt };
}

// ── Demande d'adhésion ─────────────────────────────────────────────────────

/**
 * Traçabilité commune à tous les formulaires (§10.2).
 *
 * Ces champs ne sont pas visibles par le visiteur mais accompagnent chaque
 * envoi. La version de la politique de confidentialité en fait partie : sans
 * elle, il devient impossible de démontrer à quoi une personne a consenti le
 * jour où elle s'est inscrite, et la moindre évolution du texte force une
 * reprise de données pénible.
 */
async function traceability(form: FormData) {
  const incoming = await headers();

  return {
    pageOrigin: optional(form, '__page') ?? incoming.get('referer') ?? undefined,
    trafficSource: optional(form, '__source'),
    campaign: optional(form, '__campaign'),
    consentPrivacy: form.get('consentPrivacy') === 'on',
    consentNews: form.get('consentNews') === 'on',
    policyVersion: process.env.NEXT_PUBLIC_POLICY_VERSION ?? '2026-09',
  };
}

/** Valeurs cochées d'un groupe de cases à cocher. */
function checked(form: FormData, key: string): string[] {
  return form.getAll(key).map((value) => String(value)).filter(Boolean);
}

export async function sendMembership(
  _previous: SubmitResult | null,
  form: FormData,
): Promise<SubmitResult> {
  const pledged = Number(text(form, 'pledgedAmount'));

  if (!pledged || pledged < 1000) {
    return { ok: false, message: 'La cotisation mensuelle est de 1 000 F CFA au minimum.' };
  }

  const interests = checked(form, 'interests');
  const participation = checked(form, 'participation');

  if (interests.length === 0) {
    return { ok: false, message: 'Choisissez au moins un domaine qui vous intéresse.' };
  }
  if (participation.length === 0) {
    return { ok: false, message: 'Indiquez au moins un mode de participation.' };
  }

  return submit('/members/request', {
    name: text(form, 'name'),
    email: text(form, 'email'),
    phone: text(form, 'phone'),
    city: text(form, 'city'),
    country: optional(form, 'country') ?? 'Bénin',
    profession: optional(form, 'profession'),
    interests,
    participation,
    motivation: optional(form, 'motivation'),
    pledgedAmount: pledged,
    ...(await traceability(form)),
  });
}

// ── Lettre d'information ───────────────────────────────────────────────────

export interface NewsletterState {
  ok: boolean;
  message?: string;
}

/**
 * Inscription à la lettre d'information.
 *
 * Le consentement est transmis explicitement : l'API refuse une inscription
 * sans lui, et c'est ce booléen qui atteste l'acte positif exigé.
 */
export async function subscribeNewsletter(
  _previous: NewsletterState | null,
  form: FormData,
): Promise<NewsletterState> {
  const result = await submit('/newsletter/subscribe', {
    email: text(form, 'email'),
    source: optional(form, 'source'),
    consent: form.get('consent') === 'on',
  });

  return result.ok ? { ok: true } : { ok: false, message: result.message };
}

// ── Banque alimentaire ─────────────────────────────────────────────────────

/**
 * Dépôt d'un apport ou d'une demande de retrait.
 *
 * Rien ne bouge en stock à cet instant : la demande part au back-office, et
 * c'est la validation - après le passage réel des denrées - qui écrit au
 * registre. Le message de confirmation le dit, pour qu'on ne s'attende pas à
 * voir le compteur changer.
 */
export async function sendFoodbankRequest(
  _previous: SubmitResult | null,
  form: FormData,
): Promise<SubmitResult> {
  const categoryId = optional(form, 'categoryId');

  return submit('/foodbank/requests', {
    kind: text(form, 'kind'),
    name: text(form, 'name'),
    email: text(form, 'email'),
    phone: optional(form, 'phone'),
    isAnonymous: form.get('isAnonymous') === 'on',
    // « Autre » n'est pas une catégorie : c'est l'absence de catégorie, plus
    // un libellé libre que l'association rattachera elle-même.
    categoryId: categoryId === 'autre' ? undefined : categoryId,
    otherLabel: categoryId === 'autre' ? optional(form, 'otherLabel') : undefined,
    unit: categoryId === 'autre' ? optional(form, 'otherUnit') : undefined,
    quantity: Number(text(form, 'quantity')),
    message: optional(form, 'message'),
  });
}

/** Mot d'une personne accompagnée. Il est lu avant de paraître. */
export async function sendFoodbankComment(
  _previous: SubmitResult | null,
  form: FormData,
): Promise<SubmitResult> {
  return submit('/foodbank/comments', {
    authorName: text(form, 'authorName'),
    isAnonymous: form.get('isAnonymous') === 'on',
    message: text(form, 'message'),
  });
}
