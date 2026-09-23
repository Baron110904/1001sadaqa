'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_COMPTE, REFRESH_COMPTE, cookieOptions } from './session';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api/v1';

export interface EtatCompte {
  ok: boolean;
  message?: string;
}

/** Messages de l'API, remontés tels quels : ils sont déjà rédigés en français. */
function messageDe(charge: unknown, repli: string): string {
  const brut = (charge as { message?: string | string[] } | null)?.message;
  return (Array.isArray(brut) ? brut[0] : brut) ?? repli;
}

async function poser(reponse: Response): Promise<void> {
  const { accessToken, refreshToken } = (await reponse.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  const bocal = await cookies();
  bocal.set(ACCESS_COMPTE, accessToken, cookieOptions());
  bocal.set(REFRESH_COMPTE, refreshToken, cookieOptions());
}

async function envoyer(
  chemin: string,
  donnees: Record<string, unknown>,
  repli: string,
): Promise<EtatCompte> {
  let reponse: Response;
  try {
    reponse = await fetch(`${BASE}${chemin}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, message: 'Le service est momentanément indisponible. Réessayez.' };
  }

  if (!reponse.ok) {
    const charge = await reponse.json().catch(() => null);
    return { ok: false, message: messageDe(charge, repli) };
  }

  await poser(reponse);
  return { ok: true };
}

const texte = (form: FormData, cle: string) => String(form.get(cle) ?? '').trim();

export async function creerCompte(
  _precedent: EtatCompte | null,
  form: FormData,
): Promise<EtatCompte> {
  const etat = await envoyer(
    '/accounts/register',
    {
      name: texte(form, 'name'),
      email: texte(form, 'email'),
      phone: texte(form, 'phone') || undefined,
      password: String(form.get('password') ?? ''),
    },
    'Création impossible.',
  );

  if (etat.ok) redirect('/espace');
  return etat;
}

export async function ouvrirSession(
  _precedent: EtatCompte | null,
  form: FormData,
): Promise<EtatCompte> {
  const etat = await envoyer(
    '/accounts/login',
    { email: texte(form, 'email'), password: String(form.get('password') ?? '') },
    'Identifiants incorrects.',
  );

  if (etat.ok) redirect('/espace');
  return etat;
}

/**
 * Déconnexion.
 *
 * Le jeton de rafraîchissement est invalidé côté serveur avant d'effacer les
 * cookies : sans cela, une copie du jeton resterait utilisable jusqu'à son
 * expiration naturelle, sept jours plus tard.
 */
export async function fermerSession(): Promise<void> {
  const bocal = await cookies();
  const access = bocal.get(ACCESS_COMPTE)?.value;

  if (access) {
    await fetch(`${BASE}/accounts/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}` },
      cache: 'no-store',
    }).catch(() => null);
  }

  bocal.delete(ACCESS_COMPTE);
  bocal.delete(REFRESH_COMPTE);
  redirect('/espace/connexion');
}
