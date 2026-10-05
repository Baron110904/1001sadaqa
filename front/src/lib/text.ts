import fr from '../../messages/fr.json';
import en from '../../messages/en.json';
import { LANGUE_PAR_DEFAUT, langueCourante, type Langue } from './langue';

/**
 * Libellés du site.
 *
 * Le site est servi en français et en anglais ; le contenu saisi au
 * back-office, lui, reste en français. Les textes d'interface sont regroupés
 * dans `messages/<langue>.json` plutôt qu'éparpillés dans les composants :
 * c'est ce qui permet de relire et de corriger la copie sans ouvrir de fichier
 * de code, et de traduire d'un seul endroit.
 *
 * La langue n'est pas passée en argument : elle est déposée par le gabarit de
 * langue dans un emplacement propre à la requête. Les quatre-vingt-onze appels
 * existants n'ont donc pas eu à changer de forme.
 *
 * Aucune interpolation n'est prévue : les libellés sont des chaînes fixes, les
 * valeurs variables étant composées côté composant.
 */

type Node = string | { [key: string]: Node };

const CATALOGUES: Record<Langue, Node> = { fr: fr as Node, en: en as Node };

function dansLeCatalogue(catalogue: Node, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<Node | undefined>(
      (node, part) => (node && typeof node === 'object' ? node[part] : undefined),
      catalogue,
    );

  return typeof value === 'string' ? value : undefined;
}

function lookup(key: string, langue: Langue): string {
  const value = dansLeCatalogue(CATALOGUES[langue], key);
  if (value !== undefined) return value;

  // Repli sur le français plutôt que d'afficher une clé brute : une traduction
  // oubliée doit laisser une phrase lisible, pas « home.hero.eyebrow ».
  if (langue !== LANGUE_PAR_DEFAUT) {
    const repli = dansLeCatalogue(CATALOGUES[LANGUE_PAR_DEFAUT], key);
    if (repli !== undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[texte] clé non traduite en ${langue} : ${key}`);
      }
      return repli;
    }
  }

  // En développement, une clé absente doit sauter aux yeux ; en production
  // on affiche la clé plutôt que de faire tomber la page.
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[texte] clé absente : ${key}`);
  }
  return key;
}

/**
 * Renvoie un accesseur de libellés, éventuellement restreint à une section.
 *
 *   const t = text('home.hero');
 *   t('eyebrow');            // → « Bienvenue chez 1001 SADAQA »
 */
export function text(namespace?: string): (key: string) => string {
  const langue = langueCourante();
  return (key: string) => lookup(namespace ? `${namespace}.${key}` : key, langue);
}

/** Même accesseur, pour une langue donnée. Sert aux composants client. */
export function textePour(langue: Langue, namespace?: string): (key: string) => string {
  return (key: string) => lookup(namespace ? `${namespace}.${key}` : key, langue);
}
