import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { text } from '@/lib/text';
import { getDomains } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { DomainExplorer } from '@/components/blocks/DomainExplorer';
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

  const total = domains.reduce((somme, domaine) => somme + (domaine.programs?.length ?? 0), 0);

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} lines={headingLines(t('title'))} lead={t('lead')} />

      <section className="container-page py-14 md:py-20">
        <Reveal from="none">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-6">
            <p className="text-[0.9375rem] text-muted">
              <span className="font-display font-bold text-ink">{domains.length} domaines</span>
              {' · '}
              <span className="font-display font-bold text-ink">{total} programmes</span>
            </p>

            <Link
              href="/programmes/evenements"
              className="link-sweep link-tap inline-flex items-center gap-2 font-display text-sm font-semibold text-ink"
            >
              <CalendarDays className="size-4" strokeWidth={2.2} aria-hidden />
              Voir tous nos événements
            </Link>
          </div>
        </Reveal>

        <div className="mt-12">
          <DomainExplorer domains={domains} />
        </div>
      </section>
    </>
  );
}
