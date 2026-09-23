'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { TAGS, type CacheTag } from '@/lib/api';
import { adminFetch, AdminApiError, NotAuthenticated } from '@/lib/admin/client';
import { clearTokens, readTokens, storeTokens } from '@/lib/admin/session';
import { renew, stillValid } from '@/lib/admin/renew';
import {
  findResource,
  itemPath,
  type FieldDef,
  type ResourceDef,
} from '@/lib/admin/resources';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api/v1';

export interface ActionResult {
  ok: boolean;
  message?: string;
}

// ── Authentification ───────────────────────────────────────────────────────

export async function login(
  _previous: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');

  if (!email || !password) {
    return { ok: false, message: 'Renseignez votre adresse et votre mot de passe.' };
  }

  try {
    const response = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    if (response.status === 429) {
      return {
        ok: false,
        message: 'Trop de tentatives. Patientez une minute avant de réessayer.',
      };
    }

    if (!response.ok) {
      return { ok: false, message: 'Identifiants incorrects.' };
    }

    const session = (await response.json()) as { accessToken: string; refreshToken: string };
    await storeTokens(session.accessToken, session.refreshToken);
  } catch {
    return { ok: false, message: 'Le service est injoignable. Réessayez dans un instant.' };
  }

  // On revient à la page demandée avant la connexion, à condition qu'elle soit
  // bien interne au back-office : sans ce contrôle, le paramètre permettrait
  // une redirection vers un site tiers.
  const next = String(form.get('suite') ?? '');
  redirect(next.startsWith('/admin') ? next : '/admin');
}

export async function logout(): Promise<void> {
  const { refresh } = await readTokens();

  // On invalide le jeton côté API avant d'effacer les cookies : sans cela il
  // resterait utilisable jusqu'à son expiration.
  if (refresh) {
    await adminFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
  }

  await clearTokens();
  redirect('/admin/login');
}

// ── Conversion du formulaire vers l'API ────────────────────────────────────

/**
 * Traduit les champs du formulaire selon leur type déclaré.
 *
 * Les champs facultatifs laissés vides sont **omis** et non envoyés à vide :
 * l'API valide par exemple le site web d'un partenaire avec `@IsUrl`, qu'une
 * chaîne vide ferait échouer.
 */
function buildPayload(fields: FieldDef[], form: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const raw = form.get(field.name);

    if (field.type === 'boolean') {
      // Une case décochée n'est pas transmise : l'absence vaut « faux ».
      payload[field.name] = raw === 'on' || raw === 'true';
      continue;
    }

    const value = typeof raw === 'string' ? raw.trim() : '';

    if (!value) {
      if (field.required) payload[field.name] = '';
      continue;
    }

    switch (field.type) {
      case 'list':
        // Une entrée par ligne, les lignes vides écartées.
        payload[field.name] = value
          .split('\n')
          .map((ligne) => ligne.trim())
          .filter(Boolean);
        break;
      case 'numbers':
        payload[field.name] = value
          .split(',')
          .map((part) => Number(part.trim()))
          .filter((nombre) => Number.isFinite(nombre));
        break;
      case 'number':
      case 'money':
        payload[field.name] = Number(value);
        break;
      case 'date':
        // L'API attend une date ISO complète.
        payload[field.name] = new Date(value).toISOString();
        break;
      default:
        payload[field.name] = value;
    }
  }

  return payload;
}

function friendly(error: unknown, fallback: string): string {
  if (error instanceof NotAuthenticated) return 'Session expirée. Reconnectez-vous.';

  if (error instanceof AdminApiError) {
    // Une panne serveur renvoie un message technique en anglais — « Internal
    // server error » — qui n'a rien à dire à l'équipe. Seuls les refus de
    // validation, rédigés côté API en français, sont repris tels quels.
    if (error.status >= 500) {
      return `${fallback} Le service est momentanément indisponible ; réessayez dans un instant.`;
    }
    return error.message;
  }

  return fallback;
}

/** Invalide le site public pour la ressource touchée. */
function refreshSite(resource: ResourceDef): void {
  revalidateTag(resource.tag);
  // Les compteurs de l'accueil dépendent des programmes et des projets.
  if (resource.tag === TAGS.programs || resource.tag === TAGS.projects) {
    revalidateTag(TAGS.stats);
  }
}

// ── Jeton pour les lectures faites depuis le navigateur ─────────────────

/**
 * Délivre un jeton d'accès au back-office côté navigateur.
 *
 * Les listes sont désormais chargées depuis le navigateur : sans cela, chaque
 * clic dans le menu repassait par un rendu serveur complet. Le navigateur a
 * donc besoin d'un jeton — mais pas du jeton de rafraîchissement, qui reste
 * dans son cookie `httpOnly`, hors de portée du JavaScript. C'est ici, dans
 * une action serveur, que l'échange a lieu : le renouvellement y est permis en
 * écriture, contrairement au rendu d'un composant serveur.
 *
 * Renvoie `null` quand la session est réellement finie ; l'appelant renvoie
 * alors au formulaire de connexion.
 */
export async function currentAccessToken(): Promise<string | null> {
  const { access, refresh } = await readTokens();

  if (stillValid(access)) return access ?? null;
  if (!refresh) return null;

  try {
    const renewed = await renew(refresh);
    if (!renewed) return null;
    await storeTokens(renewed.accessToken, renewed.refreshToken);
    return renewed.accessToken;
  } catch {
    // API injoignable : le jeton courant peut encore servir quelques instants.
    return access ?? null;
  }
}

// ── Contenus ───────────────────────────────────────────────────────────────

export async function saveResource(
  _previous: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const slug = String(form.get('__resource') ?? '');
  const id = String(form.get('__id') ?? '');
  const resource = findResource(slug);

  if (!resource) return { ok: false, message: 'Contenu inconnu.' };

  const payload = buildPayload(resource.fields, form);

  // Le navigateur ne contrôle pas les champs de fichier obligatoires : leur
  // valeur est renseignée par le téléversement, pas saisie. On le signale donc
  // ici, plutôt que de laisser remonter le refus de l'API.
  const missing = resource.fields.find(
    (field) =>
      field.required &&
      (field.type === 'image' || field.type === 'file') &&
      !payload[field.name],
  );
  if (missing) {
    return { ok: false, message: `Choisissez un fichier pour « ${missing.label} ».` };
  }

  try {
    if (id) {
      await adminFetch(itemPath(resource, id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await adminFetch(resource.paths.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
  } catch (error) {
    return { ok: false, message: friendly(error, "L'enregistrement a échoué.") };
  }

  refreshSite(resource);
  revalidateTag(`admin-${resource.slug}`);
  redirect(`/admin/${resource.slug}?enregistre=1`);
}

/**
 * Supprime un contenu et rend la main à la liste.
 *
 * Elle ne redirige pas : la liste vit désormais dans le navigateur et retire
 * la ligne elle-même, sans recharger l'écran. L'invalidation du cache public
 * doit en revanche rester ici — `revalidateTag` n'existe que côté serveur.
 */
export async function removeResource(slug: string, id: string): Promise<ActionResult> {
  const resource = findResource(slug);
  if (!resource || !id) return { ok: false, message: 'Contenu inconnu.' };

  try {
    await adminFetch(itemPath(resource, id), { method: 'DELETE' });
  } catch (error) {
    return { ok: false, message: friendly(error, 'La suppression a échoué.') };
  }

  refreshSite(resource);
  revalidateTag(`admin-${resource.slug}`);
  return { ok: true, message: 'Contenu supprimé.' };
}

// ── Données d'impact d'un projet ───────────────────────────────────────────

export async function addImpact(
  _previous: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const projectId = String(form.get('projectId') ?? '');

  try {
    await adminFetch(`/projets/${projectId}/impacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        indicator: String(form.get('indicator') ?? '').trim(),
        value: String(form.get('value') ?? '').trim(),
        period: new Date(String(form.get('period') ?? '')).toISOString(),
        verified: form.get('verified') === 'on',
        isPrimary: form.get('isPrimary') === 'on',
      }),
    });
  } catch (error) {
    return { ok: false, message: friendly(error, "L'ajout a échoué.") };
  }

  revalidateTag(TAGS.projects);
  return { ok: true, message: 'Indicateur ajouté.' };
}

export async function deleteImpact(form: FormData): Promise<void> {
  const impactId = String(form.get('impactId') ?? '');
  await adminFetch(`/projets/impacts/${impactId}`, { method: 'DELETE' }).catch(() => undefined);
  revalidateTag(TAGS.projects);
}

// ── Demandes entrantes ─────────────────────────────────────────────────────

export async function updateRequestStatus(form: FormData): Promise<void> {
  const path = String(form.get('__path') ?? '');
  const status = String(form.get('status') ?? '');
  const tag = String(form.get('__tag') ?? '') as CacheTag;
  const retour = String(form.get('__retour') ?? '');

  if (!path || !status) return;

  // Le refus de l'API est montré, pas avalé.
  //
  // Certaines validations peuvent échouer pour une raison que l'opérateur est
  // seul à pouvoir lever : une sortie qui dépasse le stock, un don hors liste
  // sans article rattaché. Silencieusement ignorée, la sélection revenait à sa
  // valeur d'avant sans un mot, et le même geste était retenté indéfiniment.
  let echec: string | null = null;

  try {
    await adminFetch(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (cause) {
    echec = messageDe(cause);
  }

  if (tag) revalidateTag(tag);
  revalidateTag('admin-demandes');

  // `redirect` lève : il doit rester hors du `try`.
  if (echec && retour) {
    redirect(`${retour}${retour.includes('?') ? '&' : '?'}erreur=${encodeURIComponent(echec)}`);
  }
}

// ── Mots de la banque alimentaire ──────────────────────────────────────────

/**
 * Publie ou retire un mot reçu.
 *
 * Deux gestes seulement, et aucun formulaire de saisie : l'association ne
 * réécrit pas ce qu'on lui a dit, elle décide de le montrer ou non.
 */
export async function publierMotBanque(form: FormData): Promise<void> {
  const id = String(form.get('id') ?? '');
  if (!id) return;

  await adminFetch(`/foodbank/comments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPublished: form.get('publier') === 'oui' }),
  }).catch(() => undefined);

  revalidateTag(TAGS.foodbank);
  revalidateTag('admin-demandes');
}

export async function supprimerMotBanque(form: FormData): Promise<void> {
  const id = String(form.get('id') ?? '');
  if (!id) return;

  await adminFetch(`/foodbank/comments/${id}`, { method: 'DELETE' }).catch(() => undefined);

  revalidateTag(TAGS.foodbank);
  revalidateTag('admin-demandes');
}

/** Message lisible d'une erreur d'API, à défaut une phrase générique. */
function messageDe(cause: unknown): string {
  const brut = (cause as { message?: unknown })?.message;
  const texte = Array.isArray(brut) ? brut[0] : brut;
  return typeof texte === 'string' && texte.trim()
    ? texte
    : 'L’enregistrement a échoué. Réessayez dans un instant.';
}

// ── Paramètres ─────────────────────────────────────────────────────────────

export async function updateSetting(
  _previous: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const key = String(form.get('key') ?? '');
  const kind = String(form.get('kind') ?? 'text');
  const raw = String(form.get('value') ?? '');

  let value: unknown = raw.trim();
  if (kind === 'boolean') value = form.get('value') === 'on';
  if (kind === 'number') value = Number(raw);
  if (kind === 'list') {
    value = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  try {
    await adminFetch(`/settings/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  } catch (error) {
    return { ok: false, message: friendly(error, "L'enregistrement a échoué.") };
  }

  revalidateTag(TAGS.settings);
  revalidateTag(TAGS.stats);
  revalidateTag('admin-parametres');
  return { ok: true, message: 'Paramètre enregistré.' };
}

// ── Media Library ──────────────────────────────────────────────────────────

export async function uploadMedia(
  _previous: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Choisissez un fichier.' };
  }

  // On reconstruit le corps multipart : le champ technique du formulaire ne
  // doit pas partir vers l'API.
  const body = new FormData();
  for (const [key, value] of form.entries()) {
    if (key.startsWith('__')) continue;
    body.append(key, value);
  }

  try {
    await adminFetch('/media', { method: 'POST', body });
  } catch (error) {
    return { ok: false, message: friendly(error, "L'envoi a échoué.") };
  }

  revalidateTag(TAGS.media);
  revalidateTag('admin-medias');
  return { ok: true, message: 'Média ajouté.' };
}

export async function updateMedia(
  _previous: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const id = String(form.get('__id') ?? '');

  const payload: Record<string, unknown> = {
    consentStatus: String(form.get('consentStatus') ?? 'MISSING'),
    consentScopes: form.getAll('consentScopes').map(String),
    showInGallery: form.get('showInGallery') === 'on',
    consentIsGuardian: form.get('consentIsGuardian') === 'on',
  };

  for (const key of ['altText', 'credit', 'consentSignedBy', 'consentNotes', 'consentKind']) {
    const value = String(form.get(key) ?? '').trim();
    if (value) payload[key] = value;
  }
  for (const key of ['consentSignedAt', 'consentExpiresAt', 'capturedAt']) {
    const value = String(form.get(key) ?? '').trim();
    if (value) payload[key] = new Date(value).toISOString();
  }

  try {
    await adminFetch(`/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Le refus de publication sans consentement valide arrive ici, en 422.
    return { ok: false, message: friendly(error, "L'enregistrement a échoué.") };
  }

  revalidateTag(TAGS.media);
  revalidateTag('admin-medias');
  return { ok: true, message: 'Média enregistré.' };
}

export async function deleteMedia(form: FormData): Promise<void> {
  const id = String(form.get('__id') ?? '');
  await adminFetch(`/media/${id}`, { method: 'DELETE' }).catch(() => undefined);
  revalidateTag(TAGS.media);
  revalidateTag('admin-medias');
}

// ── Utilisateurs ───────────────────────────────────────────────────────────

export async function saveUser(
  _previous: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const id = String(form.get('__id') ?? '');
  const password = String(form.get('password') ?? '');

  const payload: Record<string, unknown> = {
    name: String(form.get('name') ?? '').trim(),
    email: String(form.get('email') ?? '').trim(),
    role: String(form.get('role') ?? 'EDITOR'),
  };

  // En modification, un mot de passe vide signifie « ne pas changer ».
  if (password) payload.password = password;
  if (id) payload.isActive = form.get('isActive') === 'on';

  if (!id && !password) {
    return { ok: false, message: 'Définissez un mot de passe pour ce compte.' };
  }

  try {
    await adminFetch(id ? `/users/${id}` : '/users', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return { ok: false, message: friendly(error, "L'enregistrement a échoué.") };
  }

  revalidateTag('admin-utilisateurs');
  return { ok: true, message: id ? 'Compte mis à jour.' : 'Compte créé.' };
}

export async function deleteUser(form: FormData): Promise<void> {
  const id = String(form.get('__id') ?? '');
  await adminFetch(`/users/${id}`, { method: 'DELETE' }).catch(() => undefined);
  revalidateTag('admin-utilisateurs');
}

// ── Téléversement depuis un formulaire de contenu ──────────────────────────

export interface UploadResult {
  ok: boolean;
  url?: string;
  message?: string;
}

/**
 * Envoie un fichier au stockage et renvoie son adresse.
 *
 * Appelée depuis le champ de fichier des formulaires de contenu : l'équipe
 * choisit un fichier sur son poste, l'adresse est renseignée pour elle. Sans
 * cela il faudrait déposer les fichiers à la main dans le projet, ce qui n'est
 * pas le rôle d'un administrateur de site.
 *
 * Pour un logo ou un document, aucune personne n'est photographiée : le
 * consentement est marqué non requis, afin que ces fichiers n'encombrent pas
 * la liste des droits à compléter de la Media Library. Une photographie, elle,
 * y entre bien avec ses droits à renseigner — c'est le point de vigilance du
 * cahier des charges.
 */
export async function uploadFile(form: FormData): Promise<UploadResult> {
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Aucun fichier sélectionné.' };
  }

  const bucket = String(form.get('bucket') ?? 'FIELD');
  const withoutPeople = ['PARTNERS', 'DOCUMENTS'].includes(bucket);

  const body = new FormData();
  body.append('file', file);
  body.append('bucket', bucket);
  body.append('altText', String(form.get('altText') ?? file.name));
  if (withoutPeople) {
    body.append('consentStatus', 'GRANTED');
    body.append('consentKind', 'NOT_REQUIRED');
    body.append('consentScopes', 'WEB');
  }

  try {
    const asset = await adminFetch<{ url: string }>('/media', { method: 'POST', body });
    revalidateTag(TAGS.media);
    revalidateTag('admin-medias');
    return { ok: true, url: asset.url };
  } catch (error) {
    return { ok: false, message: friendly(error, "L'envoi du fichier a échoué.") };
  }
}
