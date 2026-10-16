import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';


export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Rien à indexer derrière une authentification, et rien à gagner à
        // laisser un robot y dépenser son quota d'exploration. `/espace`
        // couvre aussi la connexion et l'inscription, qui n'ont pas de
        // contenu propre. Les deux langues sont visées, l'anglais vivant
        // sous son préfixe.
        disallow: ['/credits', '/admin', '/espace', '/en/credits', '/en/espace'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
