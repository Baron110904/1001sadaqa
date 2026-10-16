import type { Metadata } from 'next';
import { Lien as Link } from '@/components/ui/Lien';
import { ArrowLeft } from 'lucide-react';
import { getEvents } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { ProgramEvents } from '@/components/blocks/ProgramSections';
import { Reveal } from '@/components/motion/Reveal';
import { poserLaLangueDe } from '@/lib/langue';
import { canoniquePour } from '@/lib/seo';
import { text } from '@/lib/text';
import { headingLines } from '@/lib/heading';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const langue = await poserLaLangueDe(params);
  const t = text('events');
  return { title: t('metaTitle'), description: t('metaDescription'), alternates: canoniquePour('/programmes/evenements', langue) };
}

export const revalidate = 300;

/**
 * Page de synthèse des événements, tous programmes confondus (§4.5).
 *
 * Les éditions successives d'un rendez-vous annuel — 1001 Iftar, Tabaski
 * solidaire — se retrouvent ici dans l'ordre chronologique inverse, ce qui
 * donne au visiteur l'historique que la page de campagne saisonnière annonce.
 */
export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await poserLaLangueDe(params);
  const t = text('events');
  const { items } = await getEvents({ limit: 50 });

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        lines={headingLines(t('title'))}
        lead={t('lead')}
      />

      <section className="container-page py-14 md:py-20">
        <Reveal from="none">
          <Link
            href="/programmes"
            className="link-sweep link-tap inline-flex items-center gap-2 text-sm font-medium text-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t('back')}
          </Link>
        </Reveal>

        {items.length > 0 ? (
          <ProgramEvents events={items} />
        ) : (
          <p className="mt-8 text-[0.9375rem] text-muted">
            {t('empty')}
          </p>
        )}
      </section>
    </>
  );
}
