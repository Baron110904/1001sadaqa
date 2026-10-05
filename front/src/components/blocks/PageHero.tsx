import Image from 'next/image';
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
  /** Photographie de fond du bandeau, très assombrie. */
  background?: string;
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
  background,
  children,
}: PageHeroProps) {
  const dark = tone === 'dark';
  const campagne = await getSeasonalCampaign();
  const fete = dark && campagne && campagne.theme !== 'AUCUN' ? campagne.theme : null;

  return (
    <section
      className={`relative isolate overflow-hidden ${dark ? 'bg-ink-gradient' : 'bg-cream'}`}
    >
      {/* Photographie de fond, très assombrie.
          Elle donne du corps au bandeau sans jamais disputer la lisibilité au
          titre : l'image est à 18 % d'opacité sous le dégradé vert, et le
          texte reste sur un aplat franc. Sans image fournie, le bandeau garde
          son aspect d'origine. */}
      {dark && background && (
        <Image
          src={background}
          alt=""
          fill
          priority={false}
          sizes="100vw"
          className="absolute inset-0 -z-10 object-cover opacity-[0.18]"
        />
      )}
      {dark && <div className="grain absolute inset-0" aria-hidden />}
      {fete && <FestiveDecor theme={fete} discret />}

      {/* Quand le bandeau porte un contenu complémentaire — les chiffres de la
          page Projets — celui-ci vient se poser au ras du bas du vert. D'où le
          retrait du rembourrage inférieur ici : il est rendu au bloc enfant,
          qui décide lui-même de sa respiration. */}
      <div
        className={`container-page relative pt-16 md:pt-24 ${
          children ? 'pb-0' : 'pb-16 md:pb-24'
        }`}
      >
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

      </div>

      {children && (
        <Reveal delay={0.34} className="container-page relative mt-10">
          {children}
        </Reveal>
      )}
    </section>
  );
}
