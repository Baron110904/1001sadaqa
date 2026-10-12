import { cache } from 'react';
import { LANGUE_PAR_DEFAUT, estUneLangue, type Langue } from './langues';

export * from './langues';

/**
 * Langue de la requête en cours, côté serveur.
 *
 * `cache()` de React crée un emplacement par requête : ce que le gabarit de
 * langue y dépose, tout composant serveur rendu ensuite le relit, sans qu'on
 * ait à faire descendre la langue de propriété en propriété jusqu'aux
 * quatre-vingt-onze endroits qui lisent un libellé.
 *
 * Ce n'est pas une variable globale déguisée : chaque requête obtient son
 * propre emplacement, deux visiteurs simultanés dans deux langues ne peuvent
 * donc pas se mélanger.
 *
 * Les composants client n'y ont pas accès — ils lisent la langue dans le
 * contexte posé par `FournisseurDeLangue`.
 */
const emplacement = cache((): { langue: Langue } => ({ langue: LANGUE_PAR_DEFAUT }));

export function poserLaLangue(langue: Langue): void {
  emplacement().langue = langue;
}

export function langueCourante(): Langue {
  return emplacement().langue;
}

/**
 * Pose la langue depuis les paramètres de route d'une page.
 *
 * À appeler en première ligne de **chaque** page et de chaque
 * `generateMetadata`, et non seulement dans le gabarit de langue : l'App
 * Router rend le gabarit et la page indépendamment, et rien ne garantit que
 * le premier ait déposé la langue avant que la seconde ne la lise. Le symptôme
 * était net — le menu passait en anglais, les titres restaient en français.
 *
 * Une langue inconnue laisse le français en place : c'est le gabarit qui
 * répond 404, pas chaque page.
 */
export async function poserLaLangueDe(
  params: Promise<{ locale?: string }>,
): Promise<Langue> {
  const { locale } = await params;
  const langue = locale && estUneLangue(locale) ? locale : LANGUE_PAR_DEFAUT;
  poserLaLangue(langue);
  return langue;
}
