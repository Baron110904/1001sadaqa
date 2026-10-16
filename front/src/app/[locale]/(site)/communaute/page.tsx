import type { Metadata } from 'next';
import { Lien as Link } from '@/components/ui/Lien';
import { ArrowRight, Building2, HandHeart, HeartHandshake, Users } from 'lucide-react';
import { PageHero } from '@/components/blocks/PageHero';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { poserLaLangueDe } from '@/lib/langue';
import { canoniquePour } from '@/lib/seo';
import { text } from '@/lib/text';
import { headingLines } from '@/lib/heading';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const langue = await poserLaLangueDe(params);
  const t = text('community');
  return { title: t('metaTitle'), description: t('metaDescription'), alternates: canoniquePour('/communaute', langue) };
}

export const revalidate = 300;

/** Les quatre voies d'engagement (§7.2). Le texte vit dans le catalogue. */
const VOIES = [
  { href: '/communaute/membre', icon: Users, cle: 'member', pour: 'individual' },
  { href: '/communaute/benevole', icon: HandHeart, cle: 'volunteer', pour: 'individual' },
  { href: '/communaute/donateur', icon: HeartHandshake, cle: 'donor', pour: 'individual' },
  { href: '/communaute/partenaire', icon: Building2, cle: 'partner', pour: 'organisation' },
] as const;

/** Lignes du comparatif (§7.3). Chacune désigne une entrée du catalogue. */
const COMPARATIF = ['who', 'gives', 'commitment', 'inReturn', 'validation'] as const;

/** Colonnes du comparatif, dans l'ordre du tableau. */
const COLONNES = ['member', 'volunteer', 'donor', 'partner'] as const;

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await poserLaLangueDe(params);
  const t = text('community');

  return (
    <>
      <PageHero
        background="/images/home/equipe-benevoles.jpg"
        eyebrow={t('eyebrow')}
        lines={headingLines(t('title'))}
        lead={t('lead')}
      />

      <section className="container-page py-14 md:py-20">
        <RevealGroup className="grid gap-5 md:grid-cols-2" stagger={0.08}>
          {VOIES.map((voie) => (
            <RevealItem key={voie.href}>
              <Link
                href={voie.href}
                className="group flex h-full flex-col rounded-panel border border-ink/10 bg-paper p-7 transition-colors duration-300 hover:border-ink/25 hover:bg-mist/50"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-leaf/10 text-leaf">
                  <voie.icon className="size-5" strokeWidth={1.9} aria-hidden />
                </span>

                <h2 className="mt-5 font-display text-[1.125rem] font-bold tracking-tight text-ink">
                  {t(`paths.${voie.cle}.title`)}
                </h2>

                <p className="mt-1 text-[0.8125rem] font-semibold text-muted">{t(voie.pour)}</p>

                <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">
                  {t(`paths.${voie.cle}.body`)}
                </p>

                <p className="mt-5 inline-flex items-center gap-2 font-display text-sm font-semibold text-ink">
                  {t(`paths.${voie.cle}.title`)}
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </p>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="bg-mist py-14 md:py-20">
        <div className="container-page">
          <Reveal from="none">
            <h2 className="font-display text-title font-bold tracking-tight text-ink">
              {t('compareTitle')}
            </h2>
          </Reveal>

          {/* Le tableau défile dans son propre cadre : la page ne déborde pas. */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-ink/15">
                  {['', ...COLONNES].map((colonne, index) => (
                    <th
                      key={colonne || index}
                      scope="col"
                      className="px-3 py-3 font-display text-[0.8125rem] font-bold text-ink"
                    >
                      {colonne
                        ? t(`compare.head${colonne[0].toUpperCase()}${colonne.slice(1)}`)
                        : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARATIF.map((ligne) => (
                  <tr key={ligne} className="border-b border-ink/8 last:border-0">
                    <td className="px-3 py-3 align-top font-display font-semibold text-ink">
                      {t(`compare.${ligne}.label`)}
                    </td>
                    {COLONNES.map((colonne) => (
                      <td key={colonne} className="px-3 py-3 align-top text-muted">
                        {t(`compare.${ligne}.${colonne}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </>
  );
}
