/**
 * Découpe un titre en lignes pour la révélation ligne à ligne.
 *
 * Le point de césure est porté par le fichier de traduction, au moyen d'une
 * barre verticale : « Unis par la solidarité,|des vies qui changent. »
 * Le traducteur choisit donc lui-même où son titre se casse, ce qu'un
 * découpage automatique ne permettrait pas.
 */
export function headingLines(title: string): string[] {
  return title
    .split('|')
    .map((line) => line.trim())
    .filter(Boolean);
}
