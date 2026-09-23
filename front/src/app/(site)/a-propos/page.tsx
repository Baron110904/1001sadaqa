import type { Metadata } from 'next';
import { text } from '@/lib/text';
import { getPartners, getStats, getTeam } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { PartnerLogos } from '@/components/blocks/PartnerLogos';
import { StatTile } from '@/components/blocks/StatTile';
import { TeamCard } from '@/components/blocks/TeamCard';
import { ActionLink } from '@/components/ui/Button';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { headingLines } from '@/lib/heading';

export function generateMetadata(): Metadata {
  const t = text('about');
  return { title: t('eyebrow'), description: t('lead') };
}

/**
 * Vitrine institutionnelle de l'association.
 *
 * L'ordre des rubriques suit celui du dossier institutionnel : on établit
 * d'abord la légitimité (histoire, nom, mission, valeurs), puis la crédibilité
 * (gouvernance, équipe), puis le cap (vision stratégique) et la preuve
 * (chiffres, partenaires). Les deux appels à l'action ferment la page.
 */
export default async function AboutPage() {
  const t = text('about');

  const [team, stats, partners] = await Promise.all([getTeam(), getStats(), getPartners()]);

  const valeurs = ['dignity', 'universality', 'transparency', 'equity', 'innovation'] as const;
  const organes = ['assembly', 'board', 'executive', 'committees'] as const;
  const redevabilite = ['traceability', 'control', 'reporting'] as const;
  const axes = ['programs', 'organisation', 'autonomy'] as const;
  const etapes = ['structure', 'deploy', 'transform'] as const;
  const objectives = ['one', 'two', 'three', 'four'] as const;

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} lines={headingLines(t('title'))} lead={t('lead')} />

      {/* ── Notre histoire & sens du nom ──────────────────────────────── */}
      <section className="container-page py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="font-display text-heading font-bold tracking-tight text-ink">
              {t('history.title')}
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{t('history.body')}</p>
          </Reveal>

          <Reveal from="right">
            <h2 className="font-display text-heading font-bold tracking-tight text-ink">
              {t('history.nameTitle')}
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
              {t('history.nameBody')}
            </p>

            <p className="mt-6 inline-flex rounded-full bg-gold px-5 py-2.5 font-display text-[0.875rem] font-bold tracking-tight text-ink">
              {t('history.trajectory')}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Mission & vision ─────────────────────────────────────────── */}
      <section className="bg-mist py-16 md:py-24">
        <div className="container-page">
          <RevealGroup className="grid gap-10 md:grid-cols-2 md:gap-14" stagger={0.12}>
            <RevealItem>
              <h2 className="font-display text-heading font-bold tracking-tight text-ink">
                {t('missionTitle')}
              </h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{t('missionBody')}</p>
            </RevealItem>

            <RevealItem>
              <h2 className="font-display text-heading font-bold tracking-tight text-ink">
                {t('visionTitle')}
              </h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{t('visionBody')}</p>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* ── Nos valeurs & philosophie d'intervention ─────────────────── */}
      <section className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow={t('values.eyebrow')}
          lines={headingLines(t('values.title'))}
          lead={t('values.lead')}
        />

        <RevealGroup
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          stagger={0.09}
          as="ul"
        >
          {valeurs.map((valeur) => (
            <RevealItem key={valeur} as="li">
              {/* La bordure haute dorée reprend la maquette : elle marque les
                  valeurs sans ajouter d'icône. */}
              <div className="h-full rounded-card border border-ink/10 border-t-2 border-t-gold bg-paper p-6">
                <h3 className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                  {t(`values.items.${valeur}.title`)}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
                  {t(`values.items.${valeur}.body`)}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.2} className="mt-6">
          <div className="rounded-panel bg-ink p-7 md:p-9">
            <p className="eyebrow text-gold">{t('values.philosophyTitle')}</p>
            <p className="text-heading mt-4 font-display leading-snug font-bold tracking-tight text-paper">
              «&nbsp;{t('values.philosophyQuote')}&nbsp;»
            </p>
            <p className="mt-4 max-w-3xl text-[0.9375rem] leading-relaxed text-paper/70">
              {t('values.philosophyBody')}
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── Gouvernance ──────────────────────────────────────────────── */}
      <section className="bg-mist py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow={t('governance.eyebrow')}
            lines={headingLines(t('governance.title'))}
            lead={t('governance.lead')}
          />

          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2" stagger={0.09} as="ul">
            {organes.map((organe, index) => (
              <RevealItem key={organe} as="li">
                <div className="h-full rounded-card border border-ink/10 bg-paper p-6">
                  <p className="eyebrow text-gold-deep">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-3 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                    {t(`governance.bodies.${organe}.title`)}
                  </h3>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
                    {t(`governance.bodies.${organe}.body`)}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <div className="mt-14">
            <Reveal from="none">
              <h3 className="font-display text-heading font-bold tracking-tight text-ink">
                {t('governance.accountabilityTitle')}
              </h3>
            </Reveal>

            <RevealGroup className="mt-6 grid gap-4 md:grid-cols-3" stagger={0.09} as="ul">
              {redevabilite.map((engagement) => (
                <RevealItem key={engagement} as="li">
                  <div className="h-full rounded-card bg-paper p-5">
                    <p className="font-display text-[0.9375rem] font-bold tracking-tight text-ink">
                      {t(`governance.accountability.${engagement}.title`)}
                    </p>
                    <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">
                      {t(`governance.accountability.${engagement}.body`)}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ── Équipe opérationnelle ────────────────────────────────────── */}
      {team.length > 0 && (
        <section className="container-page py-16 md:py-24">
          <SplitHeading lines={[t('teamTitle')]} className="text-title text-ink" />
          <Reveal delay={0.12}>
            <p className="mt-3 max-w-2xl text-[0.9375rem] text-muted">{t('teamLead')}</p>
          </Reveal>

          <RevealGroup
            className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.09}
            as="ul"
          >
            {team.map((member) => (
              <RevealItem key={member.id} as="li">
                <TeamCard member={member} />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}

      {/* ── Vision stratégique 2026 - 2030 ─────────────────────────────── */}
      <section className="bg-ink-gradient relative isolate overflow-hidden py-16 md:py-24">
        <div className="grain absolute inset-0" aria-hidden />

        <div className="container-page relative">
          <SectionHeading
            eyebrow={t('strategy.eyebrow')}
            lines={headingLines(t('strategy.title'))}
            lead={t('strategy.lead')}
            tone="light"
          />

          <div className="mt-12">
            <Reveal from="none">
              <p className="eyebrow text-gold">{t('strategy.axesTitle')}</p>
            </Reveal>

            <RevealGroup className="mt-5 grid gap-4 md:grid-cols-3" stagger={0.09} as="ul">
              {axes.map((axe) => (
                <RevealItem key={axe} as="li">
                  <div className="h-full rounded-card border border-paper/15 bg-paper/8 p-6 backdrop-blur-sm">
                    <h3 className="font-display text-[1.0625rem] font-bold tracking-tight text-paper">
                      {t(`strategy.axes.${axe}.title`)}
                    </h3>
                    <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-paper/70">
                      {t(`strategy.axes.${axe}.body`)}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          <div className="mt-14">
            <Reveal from="none">
              <p className="eyebrow text-gold">{t('strategy.roadmapTitle')}</p>
            </Reveal>

            <RevealGroup className="mt-5" stagger={0.1} as="ul">
              {etapes.map((etape) => (
                <RevealItem key={etape} as="li">
                  <div className="grid gap-2 border-t border-paper/15 py-6 md:grid-cols-[10rem_1fr] md:gap-8">
                    <p className="font-display text-[0.9375rem] font-bold tracking-tight text-gold tabular">
                      {t(`strategy.roadmap.${etape}.period`)}
                    </p>
                    <div>
                      <h3 className="font-display text-[1.0625rem] font-bold tracking-tight text-paper">
                        {t(`strategy.roadmap.${etape}.title`)}
                      </h3>
                      <p className="mt-2 max-w-3xl text-[0.9375rem] leading-relaxed text-paper/70">
                        {t(`strategy.roadmap.${etape}.body`)}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ── Chiffres clés & partenaires ──────────────────────────────── */}
      <section className="container-page py-16 md:py-24">
        <SectionHeading
          eyebrow={t('figures.eyebrow')}
          lines={headingLines(t('figures.title'))}
        />

        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.09}>
          <RevealItem>
            <StatTile value={stats.programs} label={t('figures.programs')} tone="gold" />
          </RevealItem>
          <RevealItem>
            <StatTile value={stats.projects} label={t('figures.projects')} />
          </RevealItem>
          <RevealItem>
            <StatTile value={stats.peopleHelped} suffix="+" label={t('figures.people')} />
          </RevealItem>
          <RevealItem>
            <StatTile value={stats.communities} label={t('figures.communities')} />
          </RevealItem>
        </RevealGroup>

        {partners.length > 0 && (
          <div className="mt-14">
            <Reveal from="none">
              <h3 className="font-display text-heading font-bold tracking-tight text-ink">
                {t('figures.partnersTitle')}
              </h3>
            </Reveal>
            <div className="mt-8">
              <PartnerLogos partners={partners} />
            </div>
          </div>
        )}
      </section>

      {/* ── Forum Social Mondial ─────────────────────────────────────── */}
      <section className="bg-gold py-16 md:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal from="none">
              <p className="eyebrow text-ink/70">{t('fsm.eyebrow')}</p>
            </Reveal>

            <SplitHeading
              delay={0.08}
              lines={headingLines(t('fsm.title'))}
              className="text-title mt-4 text-ink"
            />

            <Reveal delay={0.2}>
              <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-ink/75">
                {t('fsm.body')}
              </p>
            </Reveal>
          </div>

          <div>
            <Reveal from="none">
              <p className="eyebrow text-ink/70">{t('fsm.objectivesTitle')}</p>
            </Reveal>

            <RevealGroup className="mt-5" stagger={0.09} as="ul">
              {objectives.map((objective, index) => (
                <RevealItem key={objective} as="li">
                  <p className="flex gap-4 border-t border-ink/15 py-4">
                    <span className="font-display text-[0.8125rem] font-bold text-ink/45 tabular">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[0.9375rem] text-ink">
                      {t(`fsm.objectives.${objective}`)}
                    </span>
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ── Appels à l'action ────────────────────────────────────────── */}
      <section className="container-page py-16 md:py-24">
        <Reveal>
          <div className="rounded-panel bg-ink p-8 text-center md:p-12">
            <h2 className="font-display text-title font-bold tracking-tight text-paper">
              {t('cta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-paper/70">
              {t('cta.body')}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ActionLink href="/communaute/membre" size="lg">
                {t('cta.primary')}
              </ActionLink>
              <ActionLink href="/communaute/partenaire" variant="outline" size="lg">
                {t('cta.secondary')}
              </ActionLink>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
