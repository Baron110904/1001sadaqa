'use client';

import { currentAccessToken } from '@/app/admin/actions';

/**
 * Appels à l'API depuis le navigateur, pour les lectures du back-office.
 *
 * Pourquoi ne pas tout garder côté serveur : chaque clic dans le menu
 * déclenchait un rendu serveur complet — garde, gabarit, lecture, sérialisation
 * — soit plusieurs secondes. En lisant depuis le navigateur, un changement de
 * rubrique ne coûte plus qu'un appel à l'API.
 *
 * Le jeton d'accès vit **en mémoire**, jamais dans `localStorage` : une
 * injection de script ne peut pas le relire après coup, et il disparaît avec
 * l'onglet. Le jeton de rafraîchissement, lui, ne quitte pas son cookie
 * `httpOnly` — le navigateur ne le voit jamais.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api/v1';

export class SessionFinie extends Error {
  constructor() {
    super('Session expirée');
    this.name = 'SessionFinie';
  }
}

export class ApiErreur extends Error {
  constructor(
    readonly statut: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiErreur';
  }
}

let jeton: string | null = null;
let obtentionEnCours: Promise<string | null> | null = null;

/**
 * Demande un jeton au serveur, une seule fois à la fois.
 *
 * Les appels concurrents partagent la même promesse. Sans cela, trois listes
 * chargées ensemble déclencheraient trois rotations du jeton de
 * rafraîchissement, et les jetons émis s'invalideraient mutuellement — c'est
 * précisément ce qui provoquait les déconnexions en pleine session.
 */
function obtenirJeton(): Promise<string | null> {
  if (obtentionEnCours) return obtentionEnCours;

  obtentionEnCours = currentAccessToken()
    .then((valeur) => {
      jeton = valeur;
      return valeur;
    })
    .finally(() => {
      obtentionEnCours = null;
    });

  return obtentionEnCours;
}

/** Oublie le jeton mémorisé : forcera un nouvel échange au prochain appel. */
export function oublierJeton(): void {
  jeton = null;
}

async function messageDe(reponse: Response, defaut: string): Promise<string> {
  try {
    const corps = (await reponse.json()) as { message?: string | string[] };
    const brut = corps?.message;
    return (Array.isArray(brut) ? brut[0] : brut) ?? defaut;
  } catch {
    return defaut;
  }
}

/**
 * Lecture ou écriture sur l'API, avec renouvellement transparent.
 *
 * Un premier 401 fait redemander un jeton et rejouer l'appel une fois. Si le
 * second échoue aussi, la session est réellement finie.
 */
export async function adminApi<T>(
  chemin: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const envoyer = async (valeur: string | null): Promise<Response> =>
    fetch(`${API}${chemin}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(valeur ? { Authorization: `Bearer ${valeur}` } : {}),
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
      signal: options.signal,
    });

  let reponse = await envoyer(jeton ?? (await obtenirJeton()));

  if (reponse.status === 401) {
    oublierJeton();
    const frais = await obtenirJeton();
    if (!frais) throw new SessionFinie();
    reponse = await envoyer(frais);
  }

  if (reponse.status === 401) throw new SessionFinie();

  if (!reponse.ok) {
    throw new ApiErreur(
      reponse.status,
      reponse.status >= 500
        ? 'Le service est momentanément indisponible ; réessayez dans un instant.'
        : await messageDe(reponse, `L’API a répondu ${reponse.status}.`),
    );
  }

  if (reponse.status === 204) return undefined as T;
  return (await reponse.json()) as T;
}
