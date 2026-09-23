/**
 * Forme de la réponse de `/dashboard`.
 *
 * Une seule lecture alimente le gabarit du back-office — pour les pastilles de
 * navigation — et le tableau de bord lui-même. Le contenu est déjà filtré par
 * l'API selon le rôle : `donations` vaut `null` pour qui n'y a pas accès, et
 * l'écran doit traiter ce cas plutôt que d'afficher un zéro trompeur.
 */

export interface JournalEntry {
  at: string;
  kind: 'DON' | 'PARTENARIAT' | 'PROJET' | 'ACTUALITE' | 'MEDIA' | 'BENEVOLE' | 'MEMBRE';
  text: string;
  /** Vrai quand l'entrée appelle encore une action. */
  pending: boolean;
}

export interface DashboardOverview {
  pending: {
    donations: number | null;
    partnerships: number;
    contacts: number;
    volunteers: number;
    members: number;
    mediaConsent: number;
  };
  counts: {
    programs: number;
    projects: number;
    news: number;
    mediaToValidate: number;
  };
  donations: {
    collectedTotal: number;
    completedCount: number;
    pendingCount: number;
    /** Six mois pleins, mois courant compris ; un mois sans don vaut zéro. */
    monthly: { month: string; total: number }[];
  } | null;
  journal: JournalEntry[];
  nextEvent: {
    title: string;
    slug: string;
    location: string;
    startDate: string;
    endDate: string | null;
    isPublished: boolean;
  } | null;
}
