/**
 * Adresse publique du site.
 *
 * Une variable déclarée mais **vide** vaut absente. `??` ne le voyait pas — il
 * ne se déclenche que sur `undefined` — et `new URL('')` lève une exception :
 * la construction mourait sur la première page rendue, avec un message que
 * Next masque en production. Déclarer la variable sans la remplir est pourtant
 * le cas le plus courant sur une plateforme d'hébergement, où l'on pose les
 * clés avant de connaître le domaine.
 *
 * La barre oblique finale est retirée ici, une fois pour toutes : sans cela,
 * les adresses construites par concaténation en portaient deux.
 */
export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3100'
).replace(/\/+$/, '');
