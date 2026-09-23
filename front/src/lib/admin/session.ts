import { cookies } from 'next/headers';

/**
 * Session d'administration.
 *
 * Les deux jetons vivent dans des cookies `httpOnly` : ils ne sont pas
 * lisibles en JavaScript, ce qui les met hors d'atteinte d'une injection de
 * script — contrairement à un `localStorage`. Ils ne quittent donc jamais le
 * serveur Next, qui les rattache aux appels vers l'API.
 */
export const ACCESS_COOKIE = 'sadaqa_at';
export const REFRESH_COOKIE = 'sadaqa_rt';

/** Durée de vie du cookie de rafraîchissement, alignée sur JWT_REFRESH_TTL. */
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'CONTRIBUTOR';
}

/**
 * Options communes aux deux cookies.
 *
 * Le cookie d'accès porte la même durée que celui de rafraîchissement : c'est
 * l'API qui juge de l'expiration du jeton, pas le navigateur.
 *
 * `secure` seulement hors développement : en local, le site est servi en HTTP.
 */
export function cookieOptions(maxAge: number = REFRESH_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

/**
 * Enregistre les jetons.
 *
 * Écrire un cookie n'est permis que depuis une Server Action ou un gestionnaire
 * de route ; pendant le rendu d'un composant serveur, Next lève une erreur. On
 * la neutralise ici plutôt que de la laisser remonter : elle passerait sinon
 * pour une session invalide et provoquerait une déconnexion en pleine
 * navigation. Le renouvellement de routine a lieu dans le middleware, qui,
 * lui, peut écrire.
 */
export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  try {
    const jar = await cookies();
    jar.set(ACCESS_COOKIE, accessToken, cookieOptions());
    jar.set(REFRESH_COOKIE, refreshToken, cookieOptions());
  } catch {
    // Contexte de rendu : les jetons obtenus servent tout de même à l'appel en
    // cours, et le middleware les réenregistrera à la requête suivante.
  }
}

export async function clearTokens(): Promise<void> {
  try {
    const jar = await cookies();
    jar.delete(ACCESS_COOKIE);
    jar.delete(REFRESH_COOKIE);
  } catch {
    // Voir ci-dessus.
  }
}

export async function readTokens(): Promise<{ access?: string; refresh?: string }> {
  const jar = await cookies();
  return {
    access: jar.get(ACCESS_COOKIE)?.value,
    refresh: jar.get(REFRESH_COOKIE)?.value,
  };
}
