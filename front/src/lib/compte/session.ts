import { cookies } from 'next/headers';

/**
 * Session d'un compte public.
 *
 * Volontairement distincte de celle du back-office : noms de cookies
 * différents, point d'API différent. Une personne peut donc être connectée à
 * son espace sans l'être à l'administration, et surtout, aucune confusion
 * n'est possible entre les deux jeux de jetons.
 */

export const ACCESS_COMPTE = 'sadaqa_compte_access';
export const REFRESH_COMPTE = 'sadaqa_compte_refresh';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api/v1';

export interface Compte {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function readTokens(): Promise<{ access?: string; refresh?: string }> {
  const bocal = await cookies();
  return {
    access: bocal.get(ACCESS_COMPTE)?.value,
    refresh: bocal.get(REFRESH_COMPTE)?.value,
  };
}

/** Levée quand la session n'est plus valide : l'appelant renvoie au formulaire. */
export class SessionCompteFinie extends Error {
  constructor() {
    super('Session expirée');
    this.name = 'SessionCompteFinie';
  }
}

/**
 * Appel authentifié à l'API, au nom du compte connecté.
 *
 * Comme pour le back-office, seule une authentification refusée met fin à la
 * session : une API momentanément injoignable ne doit pas déconnecter.
 */
export async function compteFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { access, refresh } = await readTokens();
  if (!access && !refresh) throw new SessionCompteFinie();

  const reponse = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...init.headers,
    },
    cache: 'no-store',
  });

  if (reponse.status === 401) throw new SessionCompteFinie();
  if (!reponse.ok) throw new Error(`L'API a répondu ${reponse.status}.`);

  const corps = await reponse.text();
  return (corps ? JSON.parse(corps) : null) as T;
}

/** Le compte connecté, ou `null` si la session ne vaut plus rien. */
export async function compteCourant(): Promise<Compte | null> {
  try {
    return await compteFetch<Compte>('/accounts/me');
  } catch (cause) {
    if (cause instanceof SessionCompteFinie) return null;
    throw cause;
  }
}
