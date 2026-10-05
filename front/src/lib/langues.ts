/**
 * Les langues servies, et rien d'autre.
 *
 * Ce fichier n'importe rien — surtout pas React. Le middleware s'exécute sur
 * le runtime Edge et a besoin de cette liste pour décider des réécritures :
 * lui faire traverser l'emplacement par requête, qui repose sur `cache()` de
 * React, l'aurait alourdi sans raison et exposé à des surprises.
 */

export const LANGUES = ['fr', 'en'] as const;
export type Langue = (typeof LANGUES)[number];

export const LANGUE_PAR_DEFAUT: Langue = 'fr';

export const NOMS_DE_LANGUE: Record<Langue, string> = {
  fr: 'Français',
  en: 'English',
};

export const estUneLangue = (valeur: string): valeur is Langue =>
  (LANGUES as readonly string[]).includes(valeur);

/**
 * Préfixe un chemin interne de la langue donnée.
 *
 * Le français vit à la racine — `/projets` — et l'anglais sous son préfixe —
 * `/en/projets`. Sans ce passage, un lien posé dans une page anglaise
 * ramenait le visiteur au français sans prévenir.
 */
export function cheminPour(chemin: string, langue: Langue): string {
  if (langue === LANGUE_PAR_DEFAUT) return chemin;
  if (!chemin.startsWith('/')) return chemin;
  return `/${langue}${chemin === '/' ? '' : chemin}`;
}
