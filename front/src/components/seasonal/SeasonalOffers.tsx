import Link from 'next/link';
import { Moon, Sparkle, Star } from 'lucide-react';
import type { SeasonalCampaign } from '@/lib/types';
import { offres } from '@/lib/seasonal';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { formatXof } from '@/lib/format';

/** Une icône par rang, pour que les trois cartes ne se ressemblent pas. */
const ICONES = [Moon, Sparkle, Star] as const;

/**
 * Offres de contribution d'une campagne de fête.
 *
 * Chaque carte mène au formulaire de don avec son montant déjà choisi : le
 * visiteur qui a cliqué sur « Un mouton entier » n'a pas à retrouver 95 000
 * dans une liste.
 */
export function SeasonalOffers({ campaign }: { campaign: SeasonalCampaign }) {
  const cartes = offres(campaign);
  if (cartes.length === 0) return null;

  return (
    <section className="bg-ink relative isolate overflow-hidden py-14 md:py-20">
      <div className="grain absolute inset-0" aria-hidden />

      <div className="container-page relative">
        <RevealGroup className="grid gap-4 md:grid-cols-3" stagger={0.1} as="ul">
          {cartes.map((carte, index) => {
            const Icon = ICONES[index % ICONES.length];
            const destination = carte.amount
              ? `${campaign.ctaUrl}${campaign.ctaUrl.includes('?') ? '&' : '?'}montant=${carte.amount}`
              : campaign.ctaUrl;

            return (
              <RevealItem key={`${carte.label}-${index}`} as="li">
                <Link
                  href={destination}
                  className={`group flex h-full flex-col rounded-panel border p-6 transition-all duration-500 hover:-translate-y-1.5 ${
                    carte.featured
                      ? 'border-transparent bg-gold hover:shadow-lift'
                      : 'border-paper/15 bg-paper/6 backdrop-blur-sm hover:border-gold/45'
                  }`}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span
                      className={`font-display text-[1.0625rem] font-bold tracking-tight ${
                        carte.featured ? 'text-ink' : 'text-paper'
                      }`}
                    >
                      {carte.label}
                    </span>
                    <Icon
                      className={`size-5 shrink-0 transition-transform duration-500 group-hover:scale-110 ${
                        carte.featured ? 'text-ink/50' : 'text-gold'
                      }`}
                      aria-hidden
                    />
                  </span>

                  <span
                    className={`mt-5 block font-display text-[2rem] leading-none font-bold tracking-tight tabular ${
                      carte.featured ? 'text-ink' : 'text-gold'
                    }`}
                  >
                    {/* Une carte à montant libre affiche un tiret cadratin :
                        un « 0 F » se lirait comme un don nul. */}
                    {carte.amount ? formatXof(carte.amount) : ' - F'}
                  </span>

                  {carte.description && (
                    <span
                      className={`mt-4 block flex-1 text-[0.875rem] leading-relaxed ${
                        carte.featured ? 'text-ink/75' : 'text-paper/65'
                      }`}
                    >
                      {carte.description}
                    </span>
                  )}
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
