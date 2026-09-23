import { cache } from 'react';
import type {
  Domain,
  Campaign,
  NewsArticle,
  Paginated,
  Partner,
  PartnerDocument,
  Program,
  Project,
  SiteSettings,
  SiteStats,
  FoodbankOverview,
  FoodbankDonors,
  FoodbankComment,
  StockMovementRow,
  TeamMember,
  Testimonial,
  VolunteerMission,
  SeasonalCampaign,
  SiteEvent,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api/v1';

/** Durée de mise en cache des lectures publiques (ISR), en secondes. */
const REVALIDATE = 300;

class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
  ) {
    super(`API ${status} sur ${path}`);
    this.name = 'ApiError';
  }
}

/**
 * Étiquettes de cache. Le back-office les invalide après un enregistrement,
 * ce qui fait apparaître le contenu immédiatement au lieu d'attendre la
 * revalidation de cinq minutes.
 */
export const TAGS = {
  programs: 'programs',
  projects: 'projects',
  news: 'news',
  campaigns: 'campaigns',
  testimonials: 'testimonials',
  team: 'team',
  partners: 'partners',
  documents: 'documents',
  missions: 'missions',
  media: 'media',
  settings: 'settings',
  events: 'events',
  seasonal: 'seasonal',
  stats: 'stats',
  foodbank: 'foodbank',
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

async function get<T>(
  path: string,
  tags: CacheTag[] = [],
  options: { fresh?: boolean } = {},
): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    // `fresh` : lecture jamais mise en cache. Réservée aux données dont
    // l'état change avec l'horloge et non avec une écriture - une campagne
    // saisonnière s'ouvre et se ferme toute seule aux dates prévues, sans que
    // rien ne vienne invalider le cache. Mise en cache, elle restait affichée
    // après sa fin, ou absente après son ouverture.
    ...(options.fresh
      ? { cache: 'no-store' as const }
      : { next: { revalidate: REVALIDATE, tags } }),
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new ApiError(response.status, path);

  // Un point d'API qui n'a rien à renvoyer répond 200 avec un corps vide — la
  // campagne saisonnière, quand il n'y en a pas. `json()` échoue alors sur une
  // chaîne vide, et l'appel part inutilement dans la branche d'erreur.
  const corps = await response.text();
  return (corps ? JSON.parse(corps) : null) as T;
}

/**
 * Lecture avec valeur de repli, à n'employer que lorsque l'absence de donnée
 * est acceptable en soi.
 *
 * Réservée aux éléments d'habillage — les coordonnées du bandeau et du pied de
 * page — où un site sans numéro de téléphone serait plus dommageable qu'une
 * valeur légèrement datée.
 *
 * Surtout pas pour le contenu des sections. Une panne passagère de l'API
 * produirait alors un rendu « réussi » mais vide, que Next mettrait en cache :
 * la section disparaîtrait du site sans qu'aucune erreur ne soit signalée.
 * En laissant l'erreur remonter, Next conserve la dernière version valide de
 * la page — et un build lancé contre une API éteinte échoue franchement, ce
 * qui est le comportement souhaitable.
 */
async function getWithFallback<T>(
  path: string,
  fallback: T,
  tags: CacheTag[] = [],
  options: { fresh?: boolean } = {},
): Promise<T> {
  try {
    return await get<T>(path, tags, options);
  } catch (error) {
    // Next signale « cette page doit être rendue à la demande » en levant une
    // exception, qu'il attend de recevoir en retour. L'avaler comme une panne
    // d'API lui faisait figer la page avec la valeur de repli : une campagne
    // saisonnière n'apparaissait alors jamais sur les pages pré-rendues, et
    // rien ne le signalait hormis un avertissement noyé dans le journal de
    // construction.
    if ((error as { digest?: unknown })?.digest === 'DYNAMIC_SERVER_USAGE') throw error;

    console.warn(`[api] repli sur la valeur par défaut - ${String(error)}`);
    return fallback;
  }
}

/**
 * Distingue « la ressource n'existe pas » de « l'API est en panne ».
 *
 * Sans cette distinction, un `catch` global sur une page de détail
 * transformerait une panne passagère en page 404 — mise en cache par la
 * suite. Seul un 404 de l'API donne lieu à un 404 du site ; le reste remonte.
 */
export async function getOrNull<T>(loader: () => Promise<T>): Promise<T | null> {
  try {
    return await loader();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// ── Contenu institutionnel ─────────────────────────────────────────────────

export const getPrograms = () => get<Program[]>('/programs', [TAGS.programs]);
export const getProgram = (slug: string) =>
  get<Program>(`/programs/${slug}`, [TAGS.programs, TAGS.projects]);

export const getProjects = (params: { program?: string; limit?: number; page?: number } = {}) => {
  const query = new URLSearchParams();
  if (params.program) query.set('program', params.program);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.page) query.set('page', String(params.page));
  const suffix = query.size ? `?${query}` : '';
  return get<Paginated<Project>>(`/projects${suffix}`, [TAGS.projects]);
};
export const getProject = (slug: string) => get<Project>(`/projects/${slug}`, [TAGS.projects]);

export const getNews = (
  params: {
    limit?: number;
    page?: number;
    category?: string;
    /** Mots-clés cherchés dans le titre, le chapô et le corps. */
    q?: string;
    year?: number;
    /** Slug du programme dont l'article rend compte. */
    program?: string;
  } = {},
) => {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.page) query.set('page', String(params.page));
  if (params.category) query.set('category', params.category);
  if (params.q) query.set('q', params.q);
  if (params.program) query.set('program', params.program);
  if (params.year) query.set('year', String(params.year));
  const suffix = query.size ? `?${query}` : '';
  return get<Paginated<NewsArticle>>(`/news${suffix}`, [TAGS.news]);
};
export const getFeaturedNews = () => get<NewsArticle | null>('/news/featured', [TAGS.news]);
/** Années de publication disponibles, pour la barre de filtres. */
export const getNewsYears = () => get<number[]>('/news/years', [TAGS.news]);
export const getArticle = (slug: string) => get<NewsArticle>(`/news/${slug}`, [TAGS.news]);

export const getCampaigns = () => get<Campaign[]>('/campaigns', [TAGS.campaigns]);
export const getTestimonials = () => get<Testimonial[]>('/testimonials', [TAGS.testimonials]);
export const getTeam = () => get<TeamMember[]>('/team', [TAGS.team]);
export const getMissions = () => get<VolunteerMission[]>('/volunteers/missions', [TAGS.missions]);
export const getPartners = () => get<Partner[]>('/partners', [TAGS.partners]);
export const getPartnerDocuments = () =>
  get<PartnerDocument[]>('/partners/documents', [TAGS.documents]);

export const getDomains = () => get<Domain[]>('/domains', [TAGS.programs]);
export const getDomain = (slug: string) =>
  get<Domain>(`/domains/${slug}`, [TAGS.programs]);

export const getEvents = (params: { program?: string; limit?: number } = {}) => {
  const query = new URLSearchParams();
  if (params.program) query.set('program', params.program);
  if (params.limit) query.set('limit', String(params.limit));
  const suffix = query.size ? `?${query}` : '';
  return get<Paginated<SiteEvent>>(`/events${suffix}`, [TAGS.events]);
};

export const getEvent = (slug: string) => get<SiteEvent>(`/events/${slug}`, [TAGS.events]);

/**
 * Campagne en cours, ou `null`.
 *
 * Lue sans cache : l'état d'une campagne dépend de l'horloge - elle s'ouvre et
 * se ferme toute seule aux dates prévues, sans qu'aucune écriture ne vienne
 * invalider un cache. Mise en cache, elle restait affichée après sa fin.
 *
 * Mémorisée le temps d'une requête en revanche : le gabarit du site et le
 * bandeau des pages intérieures la demandent tous les deux, et sans cela la
 * même page interrogeait l'API deux fois pour la même réponse.
 *
 * Le repli à `null` est volontaire : une panne de cette lecture ne doit pas
 * empêcher le site de s'afficher, seulement le laisser dans son aspect
 * ordinaire.
 */
export const getSeasonalCampaign = cache(() =>
  getWithFallback<SeasonalCampaign | null>('/seasonal-campaigns/current', null, [TAGS.seasonal], {
    fresh: true,
  }),
);

export const getStats = () => get<SiteStats>('/stats', [TAGS.stats]);

export const getFoodbank = () =>
  get<FoodbankOverview>('/foodbank', [TAGS.foodbank]);

export const getFoodbankMovements = (limit = 60) =>
  get<StockMovementRow[]>(`/foodbank/movements?limit=${limit}`, [TAGS.foodbank]);

/** Classement des donateurs. Les dons anonymes n'en sortent jamais. */
export const getFoodbankDonors = (params: { produit?: string; type?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.produit) query.set('produit', params.produit);
  if (params.type) query.set('type', params.type);
  const suffix = query.size ? `?${query}` : '';
  return get<FoodbankDonors>(`/foodbank/donors${suffix}`, [TAGS.foodbank]);
};

export const getFoodbankComments = () =>
  get<FoodbankComment[]>('/foodbank/comments', [TAGS.foodbank]);

const SETTINGS_FALLBACK: SiteSettings = {
  'site.name': '1001 SADAQA',
  'contact.phone': '+229 01 91 43 45 91',
  'contact.email': 'contact@1001sadaqa.com',
  'contact.address': 'Fidjrossè, Houta M/ASSANI Lot 3561, Cotonou, Bénin',
  'contact.whatsapp': '2290191434591',
  'social.facebook': 'https://www.facebook.com/profile.php?id=61587609625367',
  payment: {
    enabled: false,
    provider: 'none',
    methods: ['MOBILE_MONEY', 'BANK_TRANSFER', 'CARD'],
    publicKey: '',
    mobileMoneyInstructions: '',
    bankDetails: '',
  },
};

/**
 * Les coordonnées et les liens du bandeau et du pied de page passent par ici.
 * Une valeur de repli est fournie : un site sans numéro de téléphone en cas
 * d'API indisponible serait plus dommageable qu'une valeur légèrement datée.
 */
export const getSettings = () =>
  getWithFallback<SiteSettings>('/settings/public', SETTINGS_FALLBACK, [TAGS.settings]);

// ── Écritures (formulaires publics) ────────────────────────────────────────

export interface SubmitResult {
  ok: boolean;
  /** Message d'erreur destiné à l'utilisateur, si l'envoi a échoué. */
  message?: string;
  data?: unknown;
}

export async function post(path: string, body: unknown): Promise<SubmitResult> {
  try {
    const response = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;

    if (!response.ok) {
      // NestJS renvoie soit un message, soit la liste des erreurs de validation.
      const raw = payload?.message;
      const message = Array.isArray(raw) ? raw[0] : raw;

      if (response.status === 429) {
        return {
          ok: false,
          message: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
        };
      }

      return {
        ok: false,
        message: message ?? "L'envoi a échoué. Réessayez dans un instant.",
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
