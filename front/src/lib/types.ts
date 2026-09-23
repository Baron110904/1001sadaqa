/**
 * Types des réponses de l'API NestJS.
 *
 * Ils reflètent le schéma Prisma de `back/prisma/schema.prisma`. Toute
 * évolution du schéma doit être répercutée ici — c'est le seul point de
 * couplage entre les deux applications.
 */

/** Où en est un projet. Distinct de sa visibilité publique (§5.2). */
export type ProjectStatus = 'REALISE' | 'EN_COURS' | 'A_FINANCER' | 'EN_PREPARATION';
export type NewsCategory = 'COMMUNIQUE' | 'TERRAIN' | 'PARTENARIAT' | 'INSTITUTION';
export type TestimonialType = 'BENEFICIARY' | 'VOLUNTEER' | 'PARTNER';
export type MissionKind = 'FIELD' | 'SKILLS';
export type DonationMethod = 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CARD';
export type DonationFrequency = 'ONE_TIME' | 'MONTHLY';

export interface ProgramRef {
  id: string;
  title: string;
  slug: string;
  shortLabel: string;
}

export interface Program extends ProgramRef {
  description: string;
  icon: string | null;
  image: string | null;
  order: number;

  // ── Rubriques de la fiche (§4.4) ──
  /** Le défi auquel le programme répond. */
  context: string | null;
  objectives: string | null;
  /** Qui est accompagné, selon quels critères. */
  audience: string | null;
  activities: string[];
  /** Ce que le programme doit produire. */
  outcomes: string | null;

  /**
   * Avancement du programme, filtré par la page publique.
   *
   * Distinct de la publication : un programme en préparation est visible.
   */
  status: 'ACTIF' | 'EN_PREPARATION';

  domainId: string | null;
  domain?: Domain | null;
  _count?: { projects: number; events?: number };
  projects?: Project[];
  events?: SiteEvent[];
}

/** Domaine d'intervention : le premier niveau de la page Programmes. */
export interface Domain {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  /** Numéros des ODD auxquels le domaine contribue. */
  sdgs: number[];
  order: number;
  programs?: Program[];
}

/** Événement produit par un programme. */
export interface SiteEvent {
  id: string;
  slug: string;
  title: string;
  startDate: string;
  endDate: string | null;
  location: string;
  kind: 'DISTRIBUTION' | 'CAMPAGNE_SANTE' | 'SENSIBILISATION' | 'COLLECTE' | 'JOURNEE_SOLIDAIRE';
  description: string;
  /** Bénéficiaires touchés, quantités distribuées. */
  figures: string[];
  image: string | null;
  gallery: string[];
  recurrence: 'PONCTUEL' | 'ANNUEL' | 'MENSUEL';
  program?: ProgramRef | null;
}

/**
 * Campagne saisonnière : l'habillage du site pendant le Ramadan ou la Tabaski.
 */
export interface SeasonalCampaign {
  id: string;
  slug: string;
  name: string;
  theme: 'RAMADAN' | 'TABASKI' | 'AUCUN';
  startsAt: string;
  endsAt: string;
  bannerText: string;
  bannerImage: string | null;
  ctaLabel: string;
  ctaUrl: string;
  goal: number | null;

  // ── Habillage festif ──
  //
  // Tout est facultatif : une campagne peut se limiter au bandeau haut.
  // L'accueil ne remplace son héros que si `heroTitle` est renseigné.
  greeting: string | null;
  greetingLatin: string | null;
  pillLabel: string | null;
  heroTitle: string | null;
  heroLead: string | null;
  secondaryLabel: string | null;
  secondaryUrl: string | null;

  progressUnit: string | null;
  progressCurrent: number | null;

  /** Chiffres libres, au format « valeur|libellé ». */
  figures: string[];
  /** Offres de contribution, au format « libellé|montant|description ». */
  offers: string[];
  marquee: string[];

  dailyEnabled: boolean;
  dailyTitle: string | null;
  dailyTime: string | null;
  dailyCount: number | null;
  dailyCtaLabel: string | null;
  dailyCtaUrl: string | null;
}

export interface Impact {
  id: string;
  indicator: string;
  value: string;
  period: string;
  verified: boolean;
  isPrimary: boolean;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string | null;
  status: ProjectStatus;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  image: string | null;
  gallery: string[];
  program?: ProgramRef;
  impacts: Impact[];

  // ── Rubriques de la fiche (§5.4) ──
  /** Le besoin auquel le projet répond. */
  problem: string | null;
  objectives: string | null;
  /** Nombre et profil des personnes touchées. */
  audience: string | null;

  budget: number | null;
  /**
   * Tous les montants ne sont pas communicables : la visibilité se décide
   * projet par projet, et `MASQUE` interdit d'afficher le chiffre.
   */
  budgetVisibility: 'PUBLIC' | 'PARTENAIRE' | 'MASQUE';

  /** Pourcentage de réalisation ou de financement. */
  progress: number | null;
  progressAt: string | null;

  /** Numéros des ODD auxquels le projet contribue. */
  sdgs: number[];

  /** Vidéos de terrain : une adresse par entrée. */
  videos: string[];
  /** Documents publics téléchargeables depuis la fiche. */
  documents?: PartnerDocument[];
}

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  claim: string;
  image: string | null;
  goal: number;
  raised: number;
  isUrgent: boolean;
  program: ProgramRef | null;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  category: NewsCategory;
  publishedAt: string | null;
  isFeatured: boolean;
  author?: { id: string; name: string };
  /** Légende et crédit de l'image à la une. */
  imageCaption: string | null;
  imageCredit: string | null;
  /** Programme dont l'article rend compte. Alimente le filtre de la liste. */
  program?: ProgramRef | null;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  content: string;
  image: string | null;
  type: TestimonialType;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image: string | null;
}

export interface VolunteerMission {
  id: string;
  title: string;
  slug: string;
  description: string;
  kind: MissionKind;
  commitment: string;
}

export type PartnerType = 'INSTITUTION' | 'ENTERPRISE' | 'FOUNDATION' | 'NGO';

export interface Partner {
  id: string;
  name: string;
  logo: string;
  website: string | null;
  type: PartnerType;
}

export interface PartnerDocument {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize: string | null;
}

export interface SiteStats {
  programs: number;
  projects: number;
  peopleHelped: number;
  communities: number;
}

export interface PaymentSettings {
  enabled: boolean;
  provider: string;
  methods: DonationMethod[];
  publicKey: string;
  mobileMoneyInstructions: string;
  bankDetails: string;
}

export interface SiteSettings {
  'site.name'?: string;
  'site.tagline'?: string;
  'contact.phone'?: string;
  'contact.email'?: string;
  'contact.address'?: string;
  'contact.whatsapp'?: string;
  'social.facebook'?: string;
  'social.linkedin'?: string;
  'social.tiktok'?: string;
  'analytics.ga4Id'?: string;
  'impact.peopleHelped'?: number;
  'impact.communities'?: number;
  payment: PaymentSettings;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Réponse de POST /donations. */
export interface DonationReceipt {
  id: string;
  amount: number;
  currency: string;
  method: DonationMethod;
  gateway:
    /** Adresse de la page de règlement FedaPay, où le site redirige. */
    | { mode: 'online'; url: string }
    | { mode: 'manual'; instructions: string };
}

// ── Banque alimentaire ───────────────────────────────────────────────────────

/** Niveau d'alerte d'une catégorie, déduit de ses seuils. */
export type StockLevel = 'CRITIQUE' | 'BAS' | 'OK';

export interface FoodCategoryState {
  id: string;
  slug: string;
  name: string;
  unit: string;
  examples: string | null;
  /** Somme algébrique des mouvements : jamais saisie à la main. */
  quantity: number;
  target: number;
  level: StockLevel;
}

/** Une ligne du classement des donateurs de la banque alimentaire. */
export interface FoodbankDonor {
  rang: number;
  nom: string;
  /** Nombre de dons, en nature comme en argent. */
  dons: number;
  quantite: number;
  unite: string | null;
  montant: number;
  articles: string[];
  dernier: string;
}

export interface FoodbankDonors {
  articles: { name: string; slug: string; unit: string }[];
  /** Ce sur quoi porte le classement, selon les filtres actifs. */
  critere: 'dons' | 'quantite' | 'montant';
  donateurs: FoodbankDonor[];
}

/** Mot publié d'une personne accompagnée. */
export interface FoodbankComment {
  id: string;
  authorName: string;
  message: string;
  createdAt: string;
}

export interface StockMovementRow {
  id: string;
  categoryId: string;
  direction: 'ENTREE' | 'SORTIE';
  quantity: number;
  /** Qui donne, pour une entrée ; qui reçoit, pour une sortie. */
  counterpart: string;
  detail: string | null;
  peopleServed: number | null;
  occurredAt: string;
  category: { name: string; unit: string; slug: string };
}

export interface FoodbankOverview {
  categories: FoodCategoryState[];
  /** Catégories sous leur seuil, la plus urgente d'abord. */
  needs: FoodCategoryState[];
  flow: {
    monthly: { month: string; in: number; out: number }[];
    totalIn: number;
    totalOut: number;
    peopleServed: number;
  };
  movements: StockMovementRow[];
  updatedAt?: string;
}
