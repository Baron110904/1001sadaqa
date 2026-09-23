import type { ReactNode } from 'react';
import { getSeasonalCampaign } from '@/lib/api';
import { Reveal } from '@/components/motion/Reveal';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { FestiveDecor } from '@/components/seasonal/FestiveDecor';

interface PageHeroProps {
  eyebrow: string;
  /** Une entrée par ligne du titre. */
  lines: ReactNode[];
  lead?: string;
  /** `cream` reprend le bandeau sable de la page bénévolat des maquettes. */
  tone?: 'dark' | 'cream';
  children?: ReactNode;
}

/**
 * Bandeau d'en-tête des pages intérieures.
 *
 * Deux tonalités seulement, comme dans les maquettes : vert profond par
 * défaut, sable pour la page bénévolat.
 *
 * Pendant une campagne de fête, le bandeau reçoit le même décor que l'accueil,
 * en version discrète. C'est ce qui fait que l'habillage se voit partout et
 * pas seulement sur la page d'accueil — et comme toutes les pages intérieures
 * passent par ce composant, il n'y a qu'un endroit à tenir. La lecture de la
 * campagne est mise en cache par requête : elle ne coûte rien de plus.
 */
export async function PageHero({
  eyebrow,
  lines,
  lead,
  tone = 'dark',
  children,
}: PageHeroProps) {
  const dark = tone === 'dark';
  const campagne = await getSeasonalCampaign();
  const fete = dark && campagne && campagne.theme !== 'AUCUN' ? campagne.theme : null;

  return (
    <section
      className={`relative isolate overflow-hidden ${dark ? 'bg-ink-gradient' : 'bg-cream'}`}
    >
      {dark && <div className="grain absolute inset-0" aria-hidden />}
      {fete && <FestiveDecor theme={fete} discret />}

      <div className="container-page relative py-16 md:py-24">
        <Reveal from="none">
          <p className={`eyebrow ${dark ? 'text-gold' : 'text-leaf'}`}>{eyebrow}</p>
        </Reveal>

        <SplitHeading
          as="h1"
          delay={0.08}
          lines={lines}
          className={`text-display mt-5 max-w-4xl ${dark ? 'text-paper' : 'text-ink'}`}
        />

        {lead && (
          <Reveal delay={0.26}>
            <p
              className={`mt-6 max-w-2xl text-base leading-relaxed ${
                dark ? 'text-paper/75' : 'text-ink/70'
              }`}
            >
              {lead}
            </p>
          </Reveal>
        )}

        {children && (
          <Reveal delay={0.34} className="mt-9">
            {children}
          </Reveal>
        )}
      </div>
    </section>
  );
}
