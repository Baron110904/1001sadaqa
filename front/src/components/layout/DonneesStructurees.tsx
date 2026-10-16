import { SITE_URL } from '@/lib/site';
import type { SiteSettings } from '@/lib/types';

/**
 * Carte d'identité de l'association, en JSON-LD.
 *
 * Un moteur de recherche lit le site comme une suite de paragraphes : rien ne
 * lui dit que « 1001 SADAQA » est une association, que Cotonou est son siège,
 * ou que tel numéro est bien le sien. Ce bloc le déclare explicitement, et
 * c'est ce qui alimente le panneau latéral des résultats de recherche.
 *
 * Le type `NGO` plutôt qu'`Organization` : il existe, il est plus précis, et
 * c'est exactement ce qu'est l'association.
 *
 * Les coordonnées viennent des réglages, qui sont déjà chargés par la coquille
 * du site — ce bloc ne provoque donc aucune lecture supplémentaire. Les
 * champs vides sont écartés : un balisage qui annonce une adresse vide vaut
 * moins qu'un balisage qui n'en annonce aucune.
 */
export function DonneesStructurees({ settings }: { settings: SiteSettings }) {
  const reseaux = [
    settings['social.facebook'],
    settings['social.linkedin'],
    settings['social.tiktok'],
  ].filter((lien): lien is string => Boolean(lien?.trim()));

  const adresse = settings['contact.address']?.trim();
  const telephone = settings['contact.phone']?.trim();
  const courriel = settings['contact.email']?.trim();

  const balisage = {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    name: settings['site.name']?.trim() || '1001 SADAQA',
    ...(settings['site.tagline']?.trim() ? { slogan: settings['site.tagline'].trim() } : {}),
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.png`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Cotonou',
      addressCountry: 'BJ',
      ...(adresse ? { streetAddress: adresse } : {}),
    },
    ...(telephone || courriel
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            areaServed: 'BJ',
            availableLanguage: ['fr', 'en'],
            ...(telephone ? { telephone } : {}),
            ...(courriel ? { email: courriel } : {}),
          },
        }
      : {}),
    ...(reseaux.length ? { sameAs: reseaux } : {}),
  };

  return (
    <script
      type="application/ld+json"
      // `JSON.stringify` n'échappe pas `<` : un réglage contenant la séquence
      // de fermeture d'une balise script refermerait celle-ci et le reste
      // passerait pour du code. Les réglages sont saisis au back-office, donc
      // par une personne de confiance - mais un compte d'administration peut
      // être pris, et c'est précisément le genre d'angle qu'on vise alors. On
      // échappe le caractère à la source.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(balisage).replace(/</g, '\\u003c') }}
    />
  );
}
