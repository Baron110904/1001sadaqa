import type { SeasonalCampaign } from '@/lib/types';

/**
 * Lecture d'une campagne saisonnière.
 *
 * Les listes saisies au back-office suivent une convention de séparateur — le
 * même « | » que les titres sur deux lignes ailleurs dans le site. Le décodage
 * est ici, en un seul endroit, plutôt que répété dans chaque composant.
 */

export interface Offre {
  label: string;
  /** Montant en francs, ou `null` pour une carte à montant libre. */
  amount: number | null;
  description: string;
  /** Carte mise en avant, marquée d'une étoile au back-office. */
  featured: boolean;
}

export interface Chiffre {
  value: string;
  label: string;
}

/** Vrai si la campagne porte un habillage de page d'accueil. */
export function hasHero(campaign: SeasonalCampaign | null): boolean {
  return Boolean(campaign && campaign.theme !== 'AUCUN' && campaign.heroTitle);
}

/**
 * Offres de contribution.
 *
 * On ne découpe que sur les deux premiers séparateurs : une description peut
 * ainsi contenir un « | » sans casser la ligne.
 */
export function offres(campaign: SeasonalCampaign): Offre[] {
  return campaign.offers
    .map((ligne) => {
      const [brut, montant, ...reste] = ligne.split('|');
      const label = (brut ?? '').trim();
      if (!label) return null;

      const chiffre = Number((montant ?? '').replace(/[^\d]/g, ''));

      return {
        label: label.replace(/\*+$/, '').trim(),
        amount: Number.isFinite(chiffre) && chiffre > 0 ? chiffre : null,
        description: reste.join('|').trim(),
        featured: label.endsWith('*'),
      };
    })
    .filter((offre): offre is Offre => offre !== null);
}

/** Chiffres mis en avant. Une ligne sans séparateur est ignorée. */
export function chiffres(campaign: SeasonalCampaign): Chiffre[] {
  return campaign.figures
    .map((ligne) => {
      const [value, ...reste] = ligne.split('|');
      const label = reste.join('|').trim();
      return value?.trim() && label ? { value: value.trim(), label } : null;
    })
    .filter((chiffre): chiffre is Chiffre => chiffre !== null);
}

/**
 * Position dans la campagne, en jours.
 *
 * Les bornes sont ramenées au jour en temps universel : une campagne saisie au
 * jour près ne doit pas basculer à un fuseau près. Le jour courant est borné à
 * la durée totale — une campagne encore active après sa date de fin, parce que
 * quelqu'un a repoussé la fin, n'affiche pas « jour 34 sur 30 ».
 */
export function calendrier(campaign: SeasonalCampaign, maintenant = new Date()) {
  const jour = 86_400_000;
  const auJour = (valeur: Date) =>
    Date.UTC(valeur.getUTCFullYear(), valeur.getUTCMonth(), valeur.getUTCDate());

  const debut = auJour(new Date(campaign.startsAt));
  const fin = auJour(new Date(campaign.endsAt));
  const aujourdhui = auJour(maintenant);

  const total = Math.max(1, Math.round((fin - debut) / jour) + 1);
  const ecoule = Math.round((aujourdhui - debut) / jour) + 1;

  return {
    total,
    jour: Math.min(total, Math.max(1, ecoule)),
    /** Jours restants, fin comprise. */
    restants: Math.max(0, Math.round((fin - aujourdhui) / jour)),
  };
}

/** Avancement en pourcentage, arrondi, ou `null` sans objectif chiffré. */
export function avancement(campaign: SeasonalCampaign): number | null {
  if (!campaign.goal || campaign.goal <= 0 || campaign.progressCurrent === null) return null;
  return Math.min(100, Math.round((campaign.progressCurrent / campaign.goal) * 100));
}
