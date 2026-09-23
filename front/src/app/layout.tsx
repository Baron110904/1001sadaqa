import type { Metadata, Viewport } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { text } from '@/lib/text';
import './globals.css';

// Outfit pour les titres : géométrique, très lisible en gros corps.
// Plus Jakarta Sans pour le texte courant : humaniste, chaleureuse.
const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['500', '600', '700', '800'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
});

export const viewport: Viewport = {
  themeColor: '#0B2E15',
  width: 'device-width',
  initialScale: 1,
};

export function generateMetadata(): Metadata {
  const t = text('meta');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100';

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${t('siteName')} - ${t('tagline')}`,
      template: `%s · ${t('siteName')}`,
    },
    description: t('defaultDescription'),
    icons: { icon: '/brand/logo.png', apple: '/brand/logo.png' },
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      locale: 'fr_FR',
      title: `${t('siteName')} - ${t('tagline')}`,
      description: t('defaultDescription'),
      images: [{ url: '/images/home/hero.jpg', width: 1800, height: 1200 }],
    },
    twitter: { card: 'summary_large_image' },
  };
}

/**
 * Gabarit racine : polices, feuille de style et coquille HTML.
 *
 * Il ne porte volontairement ni bandeau ni pied de page : le site public
 * (`app/(site)`) et l'administration (`app/admin`) ont chacun le leur.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    /*
      lang="fr" sur toutes les pages : le site est rédigé en français et la
      traduction est laissée au navigateur du visiteur. C'est cet attribut qui
      déclenche la proposition de traduction automatique - le déclarer
      autrement l'empêcherait.
    */
    <html lang="fr" className={`${outfit.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh antialiased">
        {/*
          Les révélations au scroll sont posées par la bibliothèque de mouvement
          sous forme de styles en ligne (opacity: 0), présents dès le rendu
          serveur. Sans JavaScript, rien ne viendrait les lever : le contenu
          resterait invisible. Ce correctif les neutralise dans ce cas.
        */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}
[data-reveal-line]{transform:none!important}
[data-progress]{width:var(--noscript-width,100%)!important}`}</style>
        </noscript>

        {children}
      </body>
    </html>
  );
}
