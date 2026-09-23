import { text } from '@/lib/text';
import { Check, HandHeart } from 'lucide-react';
import { ActionLink } from '@/components/ui/Button';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { HeroBackdrop } from './HeroBackdrop';

/**
 * Héros de la page d'accueil.
 *
 * La maquette pose un aplat vert uni ; on y ajoute une photographie très
 * assombrie et un halo, pour donner de la profondeur sans nuire à la
 * lisibilité — le voile dégradé garantit le contraste du texte.
 */
export async function HomeHero() {
  const t = text('home.hero');

  return (
    <section className="relative isolate flex min-h-[min(88vh,54rem)] items-center overflow-hidden pt-14 pb-20 md:pt-20">
      <HeroBackdrop src="/images/home/hero.jpg" alt="" />

      <div className="container-page relative grid items-end gap-12 lg:grid-cols-[1.55fr_1fr]">
        <div>
          <Reveal from="none">
            <p className="eyebrow text-gold">{t('eyebrow')}</p>
          </Reveal>

          <SplitHeading
            as="h1"
            delay={0.1}
            lines={[
              <span key="1" className="text-gold">
                {t('titleAccent')}
              </span>,
              t('titleRest'),
            ]}
            // La marge droite dégage le titre du bord de sa colonne : sans
            // elle, la deuxième ligne venait buter contre l'encart.
            className="text-hero text-shadow-hero mt-5 text-paper lg:pr-12 xl:pr-20"
          />

          <Reveal delay={0.3}>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-paper/78 md:text-[1.0625rem]">
              {t('lead')}
            </p>
          </Reveal>

          <Reveal delay={0.42}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ActionLink href="/communaute/donateur" size="lg">
                {t('primaryCta')}
              </ActionLink>
              <ActionLink href="/projets" variant="outline" size="lg">
                {t('secondaryCta')}
              </ActionLink>
            </div>
          </Reveal>

          <RevealGroup delay={0.56} stagger={0.1} className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {[t('pillar1'), t('pillar2')].map((pillar) => (
              <RevealItem key={pillar}>
                <p className="flex items-center gap-2.5 text-sm font-medium text-paper/85">
                  <Check className="size-4 shrink-0 text-gold" strokeWidth={3} aria-hidden />
                  {pillar}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <Reveal from="right" delay={0.5}>
          <aside className="rounded-panel border border-paper/15 bg-paper/8 p-6 backdrop-blur-md">
            <span className="flex size-11 items-center justify-center rounded-full bg-gold text-ink">
              <HandHeart className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <p className="mt-5 font-display text-lg font-bold tracking-tight text-paper">
              {t('cardTitle')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-paper/70">{t('cardBody')}</p>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
