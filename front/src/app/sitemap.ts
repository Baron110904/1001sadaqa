import type { MetadataRoute } from 'next';
import { getNews, getPrograms, getProjects } from '@/lib/api';
import { SITE_URL as SITE } from '@/lib/site';
import { LANGUES, cheminPour } from '@/lib/langues';

const STATIC_PATHS = [
  '',
  '/a-propos',
  '/programmes',
  '/projets',
  '/actualites',
  '/partenaires',
  '/communaute',
  '/communaute/donateur',
  '/communaute/benevole',
  '/contact',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Aucun repli : un plan de site tronqué en silence est une perte de
  // référencement invisible. Mieux vaut que la génération échoue.
  const [programs, projects, news] = await Promise.all([
    getPrograms(),
    getProjects({ limit: 60 }),
    getNews({ limit: 60 }),
  ]);

  const dynamicPaths = [
    ...programs.map((program) => `/programmes/${program.slug}`),
    ...projects.items.map((project) => `/projets/${project.slug}`),
    ...news.items.map((article) => `/actualites/${article.slug}`),
  ];

  // Chaque adresse paraît dans les deux langues, et chacune déclare l'autre :
  // sans ces renvois, Google considère les deux versions comme des pages
  // concurrentes plutôt que comme deux traductions d'une même page.
  // Chaque adresse paraît dans les deux langues, et chacune déclare l'autre :
  // sans ces renvois, Google considère les deux versions comme des pages
  // concurrentes plutôt que comme deux traductions d'une même page.
  //
  // L'accueil est écrit `''` dans la liste ci-dessus ; `cheminPour` ne
  // préfixe que ce qui commence par une barre, et laissait donc l'anglais à
  // la racine — les deux langues partageaient alors la même adresse.
  const adresse = (path: string, langue: (typeof LANGUES)[number]) =>
    `${SITE}${cheminPour(path || '/', langue)}`;

  return [...STATIC_PATHS, ...dynamicPaths].flatMap((path) =>
    LANGUES.map((langue) => ({
      url: adresse(path, langue),
      changeFrequency: (path === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
      priority: path === '' ? 1 : path.startsWith('/communaute') ? 0.9 : 0.7,
      alternates: {
        languages: Object.fromEntries(LANGUES.map((autre) => [autre, adresse(path, autre)])),
      },
    })),
  );
}
