import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { text } from '@/lib/text';
import { getDomains } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { GrilleDomaines } from '@/components/blocks/GrilleDomaines';
import { CarrouselDomaines } from '@/components/blocks/CarrouselDomaines';
import { Reveal } from '@/components/motion/Reveal';
import { headingLines } from '@/lib/heading';

export function generateMetadata(): Metadata {
  const t = text('programs');
  return { title: t('eyebrow'), description: t('lead') };
}

/**
 * Nos programmes : quatre domaines, huit programmes, et le détail de chacun.
 *
 * La hiérarchie à trois niveaux se parcourt sans changer de page (§4.2), tout
 * en conservant une adresse propre par programme pour la fiche complète.
 */
export default async function ProgramsPage() {
  const t = text('programs');
  const domains = await getDomains();

  return (
    <>
      <PageHero
        background="/images/home/about-accompagnement.jpg" eyebrow={t('eyebrow')} lines={headingLines(t('title'))} lead={t('lead')} />

      {/* ── Vitrine des domaines ──────────────────────────────────────── */}
      {/* Avant la liste dépliable : quatre cartes qui défilent disent en un
          coup d'œil ce que l'association couvre, là où l'accordéon demande
          d'ouvrir chaque ligne pour le découvrir. */}
      <section className="bg-[#fbf8f0] py-16 md:py-20">
        <div className="container-page">
          <Reveal from="none">
            <p className="eyebrow text-leaf">Nos domaines d’intervention</p>
            <h2 className="mt-3 max-w-2xl font-display text-title font-bold tracking-tight text-ink">
              Ce que chaque programme recouvre
            </h2>
            <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
              Découvrez nos initiatives pour apporter un changement concret et durable dans la vie
              des communautés.
            </p>
          </Reveal>

          <div className="mt-10">
            <CarrouselDomaines domains={domains} />
          </div>
        </div>
      </section>

      {/* ── Les domaines, à plat ──────────────────────────────────────── */}
      {/* Ni filtres ni compteur : à quatre domaines et huit programmes, ils
          demandaient de manipuler la page pour voir ce qui tient en un écran.
          Seul l'accès aux événements est conservé — c'est la seule porte vers
          cette page dans tout le site. */}
      <section className="container-page py-14 md:py-20">
        <Reveal from="none">
          <GrilleDomaines domains={domains} />
        </Reveal>

        <Reveal delay={0.1} className="mt-8">
          <Link
            href="/programmes/evenements"
            className="link-sweep link-tap inline-flex items-center gap-2 font-display text-sm font-semibold text-ink"
          >
            <CalendarDays className="size-4" strokeWidth={2.2} aria-hidden />
            Voir tous nos événements
          </Link>
        </Reveal>
      </section>

      {/* ── Renvoi vers les actualités ────────────────────────────────── */}
      {/* Pas d'articles ici : la page des actualités porte déjà la recherche,
          les filtres et la pagination. Les recopier en vignettes donnait deux
          endroits à tenir pour la même chose. */}
      <section className="border-t border-ink/10 bg-mist py-14 md:py-20">
        <Reveal from="none" className="container-page">
          <p className="eyebrow text-leaf">Actualités &amp; médias</p>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-title font-bold tracking-tight text-ink">
                Ces programmes, vus du terrain
              </h2>
              <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
                Comptes rendus de distributions, chantiers ouverts, annonces de partenariat : le
                suivi de nos actions, au fil des mois.
              </p>
            </div>

            <Link
              href="/actualites"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-display text-[0.9375rem] font-semibold text-paper transition-colors hover:bg-ink/88"
            >
              Toutes les actualités
              <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
