import type { Metadata } from 'next';
import { Lien as Link } from '@/components/ui/Lien';
import { ArrowLeft } from 'lucide-react';
import { getProjects } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { ProjectCard } from '@/components/blocks/ProjectCard';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
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
  const t = text('toFund');
  return { title: t('metaTitle'), description: t('metaDescription'), alternates: canoniquePour('/projets/a-financer', langue) };
}

export const revalidate = 300;

/**
 * Entrée B2B (§5.2).
 *
 * Les entreprises et institutions arrivent le plus souvent par LinkedIn et
 * cherchent directement ce qu'elles peuvent financer : cette adresse leur
 * évite de traverser toute la page Projets pour y parvenir.
 */
export default async function ProjectsToFundPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await poserLaLangueDe(params);
  const t = text('toFund');
  const { items } = await getProjects({ limit: 50 });
  const aFinancer = items.filter((projet) => projet.status === 'A_FINANCER');

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} lines={headingLines(t('title'))} lead={t('lead')} />

      <section className="container-page py-14 md:py-20">
        <Reveal from="none">
          <Link
            href="/projets"
            className="link-sweep link-tap inline-flex items-center gap-2 text-sm font-medium text-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t('back')}
          </Link>
        </Reveal>

        {aFinancer.length > 0 ? (
          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
            {aFinancer.map((projet) => (
              <RevealItem key={projet.id}>
                <ProjectCard project={projet} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <p className="mt-10 text-[0.9375rem] text-muted">
            {t('empty')}
          </p>
        )}
      </section>
    </>
  );
}
