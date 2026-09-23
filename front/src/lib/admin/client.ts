import { cache } from 'react';
import { readTokens, type AdminUser } from './session';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api/v1';

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

/** Levée quand plus aucun jeton n'est valide : l'appelant doit renvoyer au login. */
export class NotAuthenticated extends Error {
  constructor() {
    super('Session expirée');
    this.name = 'NotAuthenticated';
  }
}

function messageOf(payload: unknown, fallback: string): string {
  const raw = (payload as { message?: string | string[] } | null)?.message;
  return (Array.isArray(raw) ? raw[0] : raw) ?? fallback;
}

async function call(
  path: string,
  init: RequestInit,
  token: string | undefined,
): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    // Le back-office lit et écrit des données vivantes : aucune mise en cache.
    cache: 'no-store',
  });
}

/**
 * Appel authentifié à l'API.
 *
 * Le renouvellement du jeton n'a pas lieu ici mais dans le middleware, seul à
 * pouvoir écrire les cookies : toute requête vers le back-office y passe et en
 * ressort avec un jeton valable. Rafraîchir également depuis le rendu faisait
 * tourner le jeton sans pouvoir enregistrer le nouveau — et la session tombait
 * quelques instants plus tard.
 */
export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { access, refresh } = await readTokens();
  if (!access && !refresh) throw new NotAuthenticated();

  const response = await call(path, init, access);

  if (response.status === 401) throw new NotAuthenticated();

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new AdminApiError(
      response.status,
      messageOf(payload, `L'API a répondu ${response.status}.`),
    );
  }

  // 204 et autres réponses sans corps.
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * Utilisateur connecté, ou `null` si la session n'est plus valide.
 *
 * Mémorisé sur la durée d'un rendu : le gabarit et la page appellent tous deux
 * cette fonction, et sans cela chaque écran du back-office interrogeait
 * `/auth/me` deux fois.
 */
export const currentUser = cache(async (): Promise<AdminUser | null> => {
  try {
    return await adminFetch<AdminUser>('/auth/me');
  } catch (cause) {
    // Seule une authentification refusée met fin à la session.
    //
    // Cette fonction avalait toute erreur et renvoyait `null` ; le gabarit en
    // concluait une session expirée, redirigeait vers le formulaire — et ce
    // marqueur purge les cookies. Une API momentanément injoignable
    // déconnectait donc l'équipe et lui faisait perdre sa saisie en cours.
    //
    // On relaie désormais les autres pannes : l'écran d'erreur du back-office
    // les affiche, et la session reste intacte.
    if (cause instanceof NotAuthenticated) return null;
    throw cause;
  }
});
