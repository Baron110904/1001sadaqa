import type { Metadata } from 'next';
import { text } from '@/lib/text';
import { getMissions } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { VolunteerForm } from '@/components/forms/VolunteerForm';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { headingLines } from '@/lib/heading';

export function generateMetadata(): Metadata {
  const t = text('volunteer');
  return { title: t('eyebrow'), description: t('lead') };
}

export default async function VolunteerPage() {
  const t = text('volunteer');
  const missions = await getMissions();

  return (
    <>
      {/* Bandeau sable : c'est la seule page dont l'en-tête sort du vert, comme
          dans la maquette 08. */}
      <PageHero
        eyebrow={t('eyebrow')}
        lines={headingLines(t('title'))}
        lead={t('lead')}
        tone="cream"
      />

      <section className="container-page py-16 md:py-24">
        <h2 className="font-display text-title font-bold tracking-tight text-ink">
          {t('missionsTitle')}
        </h2>

        {missions.length > 0 ? (
          <RevealGroup
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.08}
            as="ul"
          >
            {missions.map((mission) => (
              <RevealItem key={mission.id} as="li">
                <div className="flex h-full flex-col rounded-card border border-ink/10 bg-paper p-5 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/45 hover:shadow-soft">
                  <p className="eyebrow text-leaf">{t(`kinds.${mission.kind}`)}</p>

                  <h3 className="mt-2.5 font-display text-[1.0625rem] leading-snug font-bold tracking-tight text-ink">
                    {mission.title}
                  </h3>

                  <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-muted">
                    {mission.description}
                  </p>

                  <p className="mt-5 border-t border-ink/10 pt-4 text-[0.8125rem] text-muted">
                    {mission.commitment}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <p className="mt-5 text-[0.9375rem] text-muted">{t('missionsEmpty')}</p>
        )}

        <Reveal className="mt-16">
          <div className="rounded-panel bg-mist p-6 md:p-10">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="font-display text-title font-bold tracking-tight text-ink">
                  {t('form.title')}
                </h2>
                <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted">
                  {t('form.body')}
                </p>
              </div>

              <VolunteerForm missions={missions} />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
