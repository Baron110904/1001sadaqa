import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

const config: NextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    // Les fichiers du back-office passent par une action serveur, dont le corps
    // est limité à 1 Mo par défaut. Or une photo de téléphone en pèse trois ou
    // quatre : l'envoi échouait en erreur 500, sans message. On aligne la
    // limite sur celle que l'API accepte (voir media.service.ts → MAX_BYTES).
    serverActions: { bodySizeLimit: '25mb' },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Médias téléversés depuis le back-office (MinIO / service compatible S3).
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      ...(process.env.NEXT_PUBLIC_MEDIA_HOST
        ? [{ protocol: 'https' as const, hostname: process.env.NEXT_PUBLIC_MEDIA_HOST }]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        // La banque alimentaire est un service à part entière, avec sa propre
        // coquille : la fiche programme ferait doublon avec elle.
        source: '/programmes/banque-alimentaire',
        destination: '/banque-alimentaire',
        permanent: true,
      },
      // ── Ancienne arborescence anglaise (§1.4 du guide) ──
      //
      // Permanentes : ces adresses ont pu être communiquées et indexées. Une
      // redirection temporaire ferait perdre le référencement acquis.
      { source: '/about', destination: '/a-propos', permanent: true },
      { source: '/programs', destination: '/programmes', permanent: true },
      { source: '/programs/:slug', destination: '/programmes/:slug', permanent: true },
      { source: '/projects', destination: '/projets', permanent: true },
      { source: '/projects/:slug', destination: '/projets/:slug', permanent: true },
      { source: '/news', destination: '/actualites', permanent: true },
      { source: '/news/:slug', destination: '/actualites/:slug', permanent: true },
      { source: '/partners', destination: '/communaute/partenaire', permanent: true },
      { source: '/take-action', destination: '/communaute', permanent: true },
      { source: '/take-action/donate', destination: '/communaute/donateur', permanent: true },
      { source: '/take-action/volunteer', destination: '/communaute/benevole', permanent: true },
      { source: '/take-action/partner', destination: '/communaute/partenaire', permanent: true },

      // ── Liens courts partageables vers les pages de conversion ──
      { source: '/don', destination: '/communaute/donateur', permanent: false },
      { source: '/donate', destination: '/communaute/donateur', permanent: false },
      { source: '/benevole', destination: '/communaute/benevole', permanent: false },
      { source: '/volunteer', destination: '/communaute/benevole', permanent: false },
      { source: '/membre', destination: '/communaute/membre', permanent: false },
      { source: '/partenaire', destination: '/communaute/partenaire', permanent: false },
      { source: '/partner', destination: '/communaute/partenaire', permanent: false },
    ];
  },
};

/**
 * Le mode développement travaille dans son propre dossier de cache.
 *
 * Les deux modes écrivaient dans `.next`. Lancer `npm run dev` pendant qu'un
 * serveur de production tournait remplaçait donc sa construction par un cache
 * de développement : le site se remettait à compiler chaque page à la
 * première visite, et répondait en dizaines de secondes. Rien ne le signalait
 * - ni message, ni erreur - et le symptôme ressemblait à une régression du
 * code. C'est arrivé trois fois.
 *
 * Deux dossiers distincts rendent la collision impossible, et le port
 * différent du script `dev` empêche les deux serveurs de se disputer 3100.
 */
export default function nextConfig(phase: string): NextConfig {
  return {
    ...config,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  };
}
