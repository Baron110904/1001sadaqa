import type { Metadata } from 'next';
import { MemberForm } from '@/components/forms/MemberForm';
import { PageHero } from '@/components/blocks/PageHero';
import { Reveal } from '@/components/motion/Reveal';
import { poserLaLangueDe } from '@/lib/langue';
import { text } from '@/lib/text';
import { headingLines } from '@/lib/heading';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  await poserLaLangueDe(params);
  const t = text('member');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

/** Ce que permet l'adhésion, repris du dossier institutionnel (§13). */
const RAISONS = ['one', 'two', 'three', 'four', 'five', 'six'] as const;

/** Les étapes du parcours (§7.4.4). */
const ETAPES = ['join', 'review', 'welcome', 'takePart', 'stay'] as const;

export default async function MemberPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await poserLaLangueDe(params);
  const t = text('member');

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        lines={headingLines(t('title'))}
        lead={t('lead')}
      />

      <section className="container-page py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            <Reveal from="none">
              <h2 className="font-display text-heading font-bold tracking-tight text-ink">
                {t('whyTitle')}
              </h2>
            </Reveal>

            <ul className="mt-6 space-y-3">
              {RAISONS.map((cle) => (
                <li key={cle} className="flex gap-3 text-[0.9375rem] leading-relaxed text-muted">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  {t(`reasons.${cle}`)}
                </li>
              ))}
            </ul>

            <h3 className="mt-10 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
              {t('whoTitle')}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
              {t('whoBody')}
            </p>

            <h3 className="mt-10 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
              {t('howTitle')}
            </h3>
            <ol className="mt-5 space-y-4">
              {ETAPES.map((cle, index) => (
                <li key={cle} className="flex gap-4">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[0.8125rem] font-bold text-paper">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block font-display text-[0.9375rem] font-semibold text-ink">
                      {t(`steps.${cle}.title`)}
                    </span>
                    <span className="mt-0.5 block text-[0.875rem] leading-relaxed text-muted">
                      {t(`steps.${cle}.body`)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-panel border border-ink/10 bg-paper p-7 md:p-9">
            <h2 className="font-display text-heading font-bold tracking-tight text-ink">
              {t('formTitle')}
            </h2>

            <div className="mt-8">
              <MemberForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
