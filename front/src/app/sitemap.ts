import type { MetadataRoute } from 'next';
import { getNews, getPrograms, getProjects } from '@/lib/api';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100').replace(/\/$/, '');

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

  return [...STATIC_PATHS, ...dynamicPaths].map((path) => ({
    url: `${SITE}${path}` || `${SITE}/`,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path.startsWith('/communaute') ? 0.9 : 0.7,
  }));
}
