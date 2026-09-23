import type { ReactNode } from 'react';
import { getSeasonalCampaign, getSettings } from '@/lib/api';
import { SeasonalDailyBar } from '@/components/seasonal/SeasonalDailyBar';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { WhatsAppFab } from '@/components/layout/WhatsAppFab';
import { ScrollProgress } from '@/components/motion/ScrollProgress';
import { Mesure } from '@/components/layout/Mesure';

/** Coquille du site public : bandeau, pied de page et éléments flottants. */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, campaign] = await Promise.all([getSettings(), getSeasonalCampaign()]);
  const phone = settings['contact.phone'] ?? '';
  const whatsapp = settings['contact.whatsapp'] ?? '';

  return (
    <>
      <Mesure ga4Id={settings['analytics.ga4Id']} />
      <ScrollProgress />

      {/* Le bandeau de campagne est rendu par l'en-tête, en surimpression
          juste en dessous : il n'occupe aucune place dans le flux et ne
          décale donc plus rien. */}
      <SiteHeader phone={phone} campaign={campaign} />

      {/* Aucune compensation de hauteur : l'en-tête est collant, donc il
          occupe sa place dans le flux. */}
      <main id="contenu">{children}</main>

      {/* La réserve de la bande du jour va sous le pied de page, et porte sa
          couleur : sans cela elle laissait paraître le fond blanc du document
          en bas d'écran. Sa hauteur est publiée par la bande elle-même, et
          vaut zéro quand celle-ci est absente ou refermée. */}
      <div className="bg-ink-deep pb-(--bande-du-jour,0px) transition-[padding] duration-500">
        <SiteFooter settings={settings} />
      </div>

      <WhatsAppFab phone={whatsapp} />

      {campaign?.dailyEnabled && campaign.dailyTitle && (
        <SeasonalDailyBar campaign={campaign} />
      )}
    </>
  );
}
