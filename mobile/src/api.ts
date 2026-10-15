/**
 * Appels à l'API de la banque alimentaire.
 *
 * L'application ne passe que par les routes publiques du site : elle n'a
 * aucun droit de plus qu'un visiteur, et une demande déposée ici arrive au
 * back-office exactement comme une demande déposée sur le web.
 *
 * Par défaut, l'adresse vise l'API lancée sur le poste de développement,
 * telle que la voit l'émulateur Android (10.0.2.2).
 */
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4100/api/v1';

export type StockLevel = 'CRITIQUE' | 'BAS' | 'OK';

export interface Category {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  level: StockLevel;
}

export type RequestKind = 'DON' | 'RETRAIT';

export interface RequestInput {
  kind: RequestKind;
  name: string;
  email: string;
  phone?: string;
  isAnonymous: boolean;
  categoryId?: string;
  otherLabel?: string;
  unit?: string;
  quantity: number;
  message?: string;
}

export type SubmitResult =
  | { ok: true; pickupCode: string | null }
  | { ok: false; message: string };

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${BASE}/foodbank`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = (await response.json()) as { categories: Category[] };
  return payload.categories;
}

/** Mêmes messages que le formulaire du site, pour les mêmes refus. */
export async function sendRequest(body: RequestInput): Promise<SubmitResult> {
  try {
    const response = await fetch(`${BASE}/foodbank/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[];
      pickupCode?: string | null;
    } | null;

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

    return { ok: true, pickupCode: payload?.pickupCode ?? null };
  } catch {
    return {
      ok: false,
      message: 'Le service est momentanément injoignable. Vérifiez votre connexion et réessayez.',
    };
  }
}
