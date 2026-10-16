import { LANGUES, LANGUE_PAR_DEFAUT, cheminPour, type Langue } from './langues';

/**
 * Adresse canonique d'une page, et ses équivalents dans l'autre langue.
 *
 * À poser dans le `generateMetadata` de **chaque** page, jamais dans un
 * gabarit : les métadonnées d'un gabarit se fusionnent dans celles de toutes
 * les pages qu'il habille, et un gabarit ne connaît pas le chemin courant. Une
 * canonique déclarée à la racine désignait ainsi l'accueil depuis les
 * vingt-sept pages du site — chacune s'annonçait comme un doublon de la page
 * d'accueil, ce qui invite un moteur de recherche à n'en retenir qu'une.
 *
 * Les `hreflang` suivent la même règle et pour la même raison : ils avaient dû
 * quitter le gabarit de langue, où ils renvoyaient chaque page vers l'accueil.
 * `x-default` désigne le français, servi à la racine.
 *
 * Le chemin attendu est celui du français, sans préfixe : « /a-propos », et
 * « / » pour l'accueil — pas la chaîne vide, que `cheminPour` ne préfixerait
 * pas.
 */
export function canoniquePour(chemin: string, langue: Langue) {
  return {
    canonical: cheminPour(chemin, langue),
    languages: {
      ...Object.fromEntries(LANGUES.map((l) => [l, cheminPour(chemin, l)])),
      'x-default': cheminPour(chemin, LANGUE_PAR_DEFAUT),
    },
  };
}
