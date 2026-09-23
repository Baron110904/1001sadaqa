import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Domain } from '@/lib/types';
import { PageHero } from '@/components/blocks/PageHero';
import { SdgBadges } from '@/components/blocks/SdgBadges';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';

/**
 * Page d'un domaine d'intervention.
 *
 * Elle donne à un domaine une adresse propre et partageable, que l'accordéon
 * de la page Programmes ne fournit pas : un bailleur intéressé par la seule
 * protection sociale peut envoyer ce lien plutôt qu'une ancre.
 */
export function DomainPage({ domain }: { domain: Domain }) {
  const programs = domain.programs ?? [];

  return (
    <>
      <PageHero eyebrow="Domaine d’intervention" lines={[domain.name]} lead={domain.description} />

      <section className="container-page py-14 md:py-20">
        <Reveal from="none">
          <Link
            href="/programmes"
            className="link-sweep link-tap inline-flex items-center gap-2 text-sm font-medium text-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Tous nos programmes
          </Link>
        </Reveal>

        <SdgBadges sdgs={domain.sdgs} className="mt-8" />

        <RevealGroup className="mt-10 grid gap-5 md:grid-cols-2" stagger={0.08}>
          {programs.map((program) => (
            <RevealItem key={program.id}>
              <article className="flex h-full flex-col rounded-panel border border-ink/10 bg-paper p-7">
                <h2 className="font-display text-[1.125rem] font-bold tracking-tight text-ink">
                  {program.title}
                </h2>
                <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">
                  {program.context ?? program.description}
                </p>

                <Link
                  href={`/programmes/${program.slug}`}
                  className="link-sweep link-tap mt-6 inline-flex items-center gap-2 font-display text-sm font-semibold text-ink"
                >
                  Voir la fiche complète
                  <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
                </Link>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </>
  );
}
