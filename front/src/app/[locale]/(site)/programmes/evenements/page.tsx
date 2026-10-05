import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getEvents } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { ProgramEvents } from '@/components/blocks/ProgramSections';
import { Reveal } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'Nos événements',
  description:
    'Distributions, campagnes de santé, journées de sensibilisation et actions de Ramadan ou de Tabaski menées par 1001 SADAQA.',
};

export const revalidate = 300;

/**
 * Page de synthèse des événements, tous programmes confondus (§4.5).
 *
 * Les éditions successives d'un rendez-vous annuel — 1001 Iftar, Tabaski
 * solidaire — se retrouvent ici dans l'ordre chronologique inverse, ce qui
 * donne au visiteur l'historique que la page de campagne saisonnière annonce.
 */
export default async function EventsPage() {
  const { items } = await getEvents({ limit: 50 });

  return (
    <>
      <PageHero
        eyebrow="Événements"
        lines={['Ce que nous avons', 'réalisé sur le terrain']}
        lead="Chaque action menée, avec sa date, son lieu et ce qu’elle a produit."
      />

      <section className="container-page py-14 md:py-20">
        <Reveal from="none">
          <Link
            href="/programmes"
            className="link-sweep link-tap inline-flex items-center gap-2 text-sm font-medium text-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour aux programmes
          </Link>
        </Reveal>

        {items.length > 0 ? (
          <ProgramEvents events={items} />
        ) : (
          <p className="mt-8 text-[0.9375rem] text-muted">
            Les comptes rendus d’événements seront publiés ici.
          </p>
        )}
      </section>
    </>
  );
}
