import { ArrowRight } from 'lucide-react';
import type { SeasonalCampaign } from '@/lib/types';
import { avancement, calendrier, chiffres } from '@/lib/seasonal';
import { ActionLink } from '@/components/ui/Button';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { FestiveDecor } from './FestiveDecor';
import { headingLines } from '@/lib/heading';

/**
 * Héros de la page d'accueil pendant une campagne de fête.
 *
 * Il remplace le héros habituel, et non s'y ajoute : deux bandeaux
 * plein-écran l'un sur l'autre repousseraient le contenu hors de vue.
 *
 * Les deux thèmes partagent la même structure — salutation, titre, texte,
 * deux boutons, puis un encart d'avancement. Seul cet encart diffère : le
 * Ramadan compte des nuits sur un calendrier, la Tabaski compte des parts.
 */
export function SeasonalHero({ campaign }: { campaign: SeasonalCampaign }) {
  const ramadan = campaign.theme === 'RAMADAN';
  const cal = calendrier(campaign);
  const pourcent = avancement(campaign);
  const stats = chiffres(campaign);

  return (
    <section className="bg-ink-gradient relative isolate overflow-hidden">
      <div className="grain absolute inset-0" aria-hidden />
      <FestiveDecor theme={ramadan ? 'RAMADAN' : 'TABASKI'} />

      <div
        className={`container-page relative grid items-center gap-12 pt-20 pb-16 md:pt-28 md:pb-20 ${
          ramadan ? 'lg:grid-cols-[1.1fr_1fr] lg:gap-16' : ''
        }`}
      >
        <div className={ramadan ? '' : 'mx-auto max-w-3xl text-center'}>
          {(campaign.greeting || campaign.greetingLatin) && (
            <Reveal from="none">
              <p
                className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${
                  ramadan ? '' : 'justify-center'
                }`}
              >
                {campaign.greeting && (
                  <span dir="rtl" lang="ar" className="font-display text-xl text-gold">
                    {campaign.greeting}
                  </span>
                )}
                {campaign.greetingLatin && (
                  <span className="eyebrow text-paper/55">{campaign.greetingLatin}</span>
                )}
              </p>
            </Reveal>
          )}

          <SplitHeading
            as="h1"
            delay={0.1}
            lines={headingLines(campaign.heroTitle ?? campaign.name)}
            className="text-hero text-shadow-hero mt-5 text-paper"
          />

          {campaign.heroLead && (
            <Reveal delay={0.3}>
              <p
                className={`mt-7 text-base leading-relaxed text-paper/78 md:text-[1.0625rem] ${
                  ramadan ? 'max-w-xl' : 'mx-auto max-w-2xl'
                }`}
              >
                {campaign.heroLead}
              </p>
            </Reveal>
          )}

          <Reveal delay={0.42}>
            <div
              className={`mt-9 flex flex-wrap items-center gap-3 ${
                ramadan ? '' : 'justify-center'
              }`}
            >
              <ActionLink href={campaign.ctaUrl} size="lg">
                {campaign.ctaLabel}
              </ActionLink>
              {campaign.secondaryLabel && campaign.secondaryUrl && (
                <ActionLink href={campaign.secondaryUrl} variant="outline" size="lg">
                  {campaign.secondaryLabel}
                </ActionLink>
              )}
            </div>
          </Reveal>
        </div>

        {/* ── Calendrier du don, propre au Ramadan ───────────────────────── */}
        {ramadan && (
          <Reveal from="right" delay={0.5}>
            <aside className="rounded-panel border border-paper/15 bg-paper/8 p-6 backdrop-blur-md">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-[1.0625rem] font-bold tracking-tight text-paper">
                  Calendrier du don
                </h2>
                <p className="font-display text-[0.8125rem] font-bold text-gold tabular">
                  Jour {cal.jour} / {cal.total}
                </p>
              </div>

              {/* Une case par nuit. La grille est décorative - le texte sous
                  elle dit la même chose, donc on ne la lit pas deux fois. */}
              <ul
                className="mt-5 grid gap-1.5"
                style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
                aria-hidden
              >
                {Array.from({ length: cal.total }, (_, index) => {
                  const numero = index + 1;
                  const passee = numero < cal.jour;
                  const courante = numero === cal.jour;

                  return (
                    <li
                      key={numero}
                      // La case du jour respire : c'est le seul repère visuel
                      // qui dit « on en est là », et une case simplement plus
                      // claire se perdait dans la grille.
                      className={`aspect-square rounded-[0.3rem] ${
                        courante
                          ? 'animate-glow bg-paper shadow-[0_0_12px_rgba(255,255,255,0.55)]'
                          : passee
                            ? 'bg-gold'
                            : 'border border-paper/12 bg-paper/5'
                      }`}
                    />
                  );
                })}
              </ul>

              {campaign.progressCurrent !== null && (
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-[2rem] leading-none font-bold tracking-tight text-gold tabular">
                    {campaign.progressCurrent.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-[0.875rem] text-paper/70">
                    {campaign.progressUnit ?? ''} déjà financés
                  </span>
                </p>
              )}

              {pourcent !== null && (
                <>
                  <div
                    className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper/12"
                    role="progressbar"
                    aria-valuenow={pourcent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Objectif ${campaign.goal} ${campaign.progressUnit ?? ''}`}
                  >
                    {/* Un reflet parcourt la barre : l'avancement se lit
                        comme quelque chose de vivant, pas comme un trait figé. */}
                    <div
                      className="relative h-full overflow-hidden rounded-full bg-linear-to-r from-gold-deep to-gold"
                      style={{ width: `${pourcent}%` }}
                    >
                      <span className="animate-sheen absolute inset-0 bg-linear-to-r from-transparent via-white/45 to-transparent" />
                    </div>
                  </div>

                  <p className="mt-2 flex flex-wrap justify-between gap-2 text-[0.75rem] text-paper/55">
                    <span>
                      Objectif {campaign.goal?.toLocaleString('fr-FR')}{' '}
                      {campaign.progressUnit ?? ''}
                    </span>
                    <span>
                      {cal.restants} nuit{cal.restants > 1 ? 's' : ''} restante
                      {cal.restants > 1 ? 's' : ''}
                    </span>
                  </p>
                </>
              )}
            </aside>
          </Reveal>
        )}
      </div>

      {/* ── Bandeau de chiffres, propre à la Tabaski ──────────────────── */}
      {!ramadan && (stats.length > 0 || pourcent !== null) && (
        <div className="relative border-t border-paper/12 bg-ink-deep/40">
          <div className="container-page flex flex-wrap items-center justify-between gap-8 py-8">
            <RevealGroup className="flex flex-wrap gap-x-12 gap-y-5" stagger={0.09}>
              {campaign.progressCurrent !== null && (
                <RevealItem>
                  <p>
                    <span className="block font-display text-[2rem] leading-none font-bold tracking-tight text-gold tabular">
                      {campaign.progressCurrent.toLocaleString('fr-FR')}
                    </span>
                    <span className="mt-1.5 block text-[0.8125rem] text-paper/60">
                      {campaign.progressUnit ?? ''} déjà offertes
                    </span>
                  </p>
                </RevealItem>
              )}

              {stats.map((stat) => (
                <RevealItem key={stat.label}>
                  <p>
                    <span className="block font-display text-[2rem] leading-none font-bold tracking-tight text-paper tabular">
                      {stat.value}
                    </span>
                    <span className="mt-1.5 block text-[0.8125rem] text-paper/60">
                      {stat.label}
                    </span>
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>

            {pourcent !== null && (
              <Reveal from="right" className="min-w-[16rem] flex-1">
                <div className="flex items-baseline justify-between gap-4 text-[0.8125rem]">
                  <span className="text-paper/60">
                    Objectif {campaign.goal?.toLocaleString('fr-FR')}{' '}
                    {campaign.progressUnit ?? ''}
                  </span>
                  <span className="font-display font-bold text-gold tabular">{pourcent} %</span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper/12"
                  role="progressbar"
                  aria-valuenow={pourcent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Objectif ${campaign.goal} ${campaign.progressUnit ?? ''}`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold"
                    style={{ width: `${pourcent}%` }}
                  />
                </div>
              </Reveal>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** Bandeau défilant des mentions de la campagne. */
export function SeasonalMarquee({ campaign }: { campaign: SeasonalCampaign }) {
  // En dessous de deux mentions, un bandeau qui défile n'a rien à faire
  // défiler : on ne l'affiche pas.
  if (campaign.marquee.length < 2) return null;

  // La suite est doublée : c'est ce qui permet à la boucle de se refermer sans
  // couture, le décalage de -50 % ramenant exactement au point de départ.
  const suite = [...campaign.marquee, ...campaign.marquee];

  return (
    <div className="overflow-hidden bg-gold py-3.5" role="presentation">
      <ul className="animate-marquee flex w-max items-center gap-8">
        {suite.map((mention, index) => (
          <li key={`${mention}-${index}`} className="flex items-center gap-8">
            <span className="font-display text-[0.9375rem] font-bold whitespace-nowrap text-ink">
              {mention}
            </span>
            <ArrowRight className="size-3.5 shrink-0 text-ink/40" aria-hidden />
          </li>
        ))}
      </ul>
    </div>
  );
}
