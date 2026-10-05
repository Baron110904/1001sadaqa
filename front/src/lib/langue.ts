import { cache } from 'react';
import { LANGUE_PAR_DEFAUT, type Langue } from './langues';

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
