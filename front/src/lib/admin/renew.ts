/**
 * Renouvellement du jeton d'accès, sans rotation concurrente.
 *
 * L'API fait tourner le jeton de rafraîchissement : après un échange, l'ancien
 * ne vaut plus rien. Or plusieurs requêtes partent souvent de front — la page
 * et ses préchargements, ou deux onglets ouverts ensemble — toutes porteuses du
 * même jeton. Sans la table ci-dessous, la première rotation invalidait les
 * autres et la session tombait au milieu du travail.
 *
 * Ce module est appelé depuis deux environnements d'exécution — le middleware
 * et les Server Actions — qui ne partagent pas leur mémoire. Chacun déduplique
 * donc de son côté, ce qui suffit : une requête ne traverse qu'un des deux.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api/v1';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Marge avant expiration, en secondes.
 *
 * Large à dessein : le jeton doit rester valable pendant tout le rendu de la
 * page, appels à l'API compris. Une minute suffisait en théorie, mais pas
 * quand le rendu prend plus de temps que prévu — l'appel partait alors avec un
 * jeton expiré depuis quelques secondes.
 */
export const RENEW_MARGIN = 300;

/** Durée pendant laquelle un échange déjà fait reste resservi, en ms. */
const EXCHANGE_TTL = 30_000;

const exchanges = new Map<string, { pair: Promise<TokenPair | null>; at: number }>();

/**
 * Date d'expiration portée par un jeton, en secondes.
 *
 * On lit la charge utile sans vérifier la signature : elle ne sert qu'à décider
 * s'il faut renouveler. L'autorisation reste tranchée par l'API, qui vérifie la
 * signature de son côté — un jeton falsifié ici ne donnerait accès à rien.
 */
export function expiryOf(token: string | undefined): number | null {
  if (!token) return null;

  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as { exp?: number };
    return typeof claims.exp === 'number' ? claims.exp : null;
  } catch {
    return null;
  }
}

/** Le jeton a-t-il encore assez de marge pour servir le rendu qui suit ? */
export function stillValid(token: string | undefined): boolean {
  const expiry = expiryOf(token);
  if (expiry === null) return false;
  return expiry - RENEW_MARGIN > Math.floor(Date.now() / 1000);
}

/**
 * Échange un jeton de rafraîchissement contre un couple neuf.
 *
 * Renvoie `null` si l'API refuse — session réellement finie. Lève si l'API est
 * injoignable : l'appelant distingue ainsi une panne d'un refus.
 */
export function renew(refreshToken: string): Promise<TokenPair | null> {
  const now = Date.now();

  for (const [key, entry] of exchanges) {
    if (now - entry.at > EXCHANGE_TTL) exchanges.delete(key);
  }

  const known = exchanges.get(refreshToken);
  if (known) return known.pair;

  const pair = fetch(`${API}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  }).then(async (response) => (response.ok ? ((await response.json()) as TokenPair) : null));

  exchanges.set(refreshToken, { pair, at: now });

  // Un échec réseau ne doit pas rester en mémoire : le prochain essai doit
  // pouvoir repartir de zéro.
  pair.catch(() => exchanges.delete(refreshToken));

  return pair;
}
