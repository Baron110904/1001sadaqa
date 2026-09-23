import fr from '../../messages/fr.json';

/**
 * Libellés du site.
 *
 * Le site est en français ; la traduction éventuelle est laissée au
 * navigateur du visiteur, ce qui suppose que toutes les pages déclarent
 * `lang="fr"`. Les textes restent regroupés dans `messages/fr.json` plutôt
 * qu'éparpillés dans les composants : c'est ce qui permet de relire et de
 * corriger la copie sans ouvrir de fichier de code.
 *
 * Aucune interpolation n'est prévue : les libellés sont des chaînes fixes, les
 * valeurs variables étant composées côté composant.
 */

type Node = string | { [key: string]: Node };

function lookup(key: string): string {
  const value = key
    .split('.')
    .reduce<Node | undefined>(
      (node, part) => (node && typeof node === 'object' ? node[part] : undefined),
      fr as Node,
    );

  if (typeof value !== 'string') {
    // En développement, une clé absente doit sauter aux yeux ; en production
    // on affiche la clé plutôt que de faire tomber la page.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[texte] clé absente : ${key}`);
    }
    return key;
  }

  return value;
}

/**
 * Renvoie un accesseur de libellés, éventuellement restreint à une section.
 *
 *   const t = text('home.hero');
 *   t('eyebrow');            // → « Bienvenue chez 1001 SADAQA »
 */
export function text(namespace?: string): (key: string) => string {
  return (key: string) => lookup(namespace ? `${namespace}.${key}` : key);
}
