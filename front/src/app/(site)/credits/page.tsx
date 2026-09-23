import type { Metadata } from 'next';
import { text } from '@/lib/text';
import { CircleAlert, ExternalLink } from 'lucide-react';
import { PageHero } from '@/components/blocks/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import creditsData from '../../../../public/images/credits.json';

interface CreditEntry {
  slot: string;
  file: string;
  title: string;
  author: string;
  license: string;
  source: string;
  era?: string;
}

const credits = creditsData as CreditEntry[];

export function generateMetadata(): Metadata {
  const t = text('credits');
  // Cette page n'a pas d'intérêt dans les résultats de recherche.
  return { title: t('title'), robots: { index: false, follow: true } };
}

/**
 * Page de crédits des visuels.
 *
 * Elle satisfait l'obligation d'attribution des licences CC BY et CC BY-SA,
 * et dit explicitement que ces photographies ne représentent pas des
 * bénéficiaires de l'association. À conserver aussi longtemps que les visuels
 * d'attente sont en ligne.
 */
export default function CreditsPage() {
  const t = text('credits');

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} lines={[t('title')]} lead={t('lead')} />

      <section className="container-page py-16 md:py-24">
        <Reveal>
          <div className="flex items-start gap-4 rounded-panel border border-gold/40 bg-gold/8 p-6">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-gold-deep" aria-hidden />
            <div>
              <h2 className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                {t('warningTitle')}
              </h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink/75">
                {t('warningBody')}
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          {/* Le tableau défile horizontalement dans son propre cadre : la page
              elle-même ne déborde jamais. */}
          <div className="overflow-x-auto rounded-card border border-ink/10">
            <table className="w-full min-w-[52rem] border-collapse text-left text-[0.8125rem]">
              <thead>
                <tr className="bg-mist">
                  <th scope="col" className="px-4 py-3 font-display font-bold text-ink">
                    {t('tableSlot')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-display font-bold text-ink">
                    {t('tableTitle')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-display font-bold text-ink">
                    {t('tableAuthor')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-display font-bold text-ink">
                    {t('tableLicense')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-display font-bold text-ink">
                    {t('tableSource')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {credits.map((entry) => (
                  <tr key={entry.slot} className="border-t border-ink/10 align-top">
                    <td className="px-4 py-3 font-mono text-[0.75rem] text-muted">{entry.slot}</td>
                    <td className="px-4 py-3 text-ink">{entry.title}</td>
                    <td className="px-4 py-3 text-muted">{entry.author}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{entry.license}</td>
                    <td className="px-4 py-3">
                      <a
                        href={entry.source}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="link-sweep link-tap inline-flex items-center gap-1.5 font-medium whitespace-nowrap text-leaf"
                      >
                        {t('sourceLink')}
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal delay={0.16} className="mt-12">
          <h2 className="font-display text-heading font-bold tracking-tight text-ink">
            {t('brandTitle')}
          </h2>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
            {t('brandBody')}
          </p>
        </Reveal>
      </section>
    </>
  );
}
