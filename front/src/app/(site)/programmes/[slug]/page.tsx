import type { Metadata } from 'next';
import { text } from '@/lib/text';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getDomain, getDomains, getOrNull, getProgram, getPrograms } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { ProjectCard } from '@/components/blocks/ProjectCard';
import { ProgramEvents, ProgramSections } from '@/components/blocks/ProgramSections';
import { DomainPage } from '@/components/blocks/DomainPage';
import { ParallaxMedia } from '@/components/motion/ParallaxMedia';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { ActionLink } from '@/components/ui/Button';
import { toParagraphs } from '@/lib/format';

// Les pages de programme sont pré-rendues : leur nombre est faible et stable.
export async function generateStaticParams() {
  try {
    const [programs, domains] = await Promise.all([getPrograms(), getDomains()]);
    return [...programs, ...domains].map((entree) => ({ slug: entree.slug }));
  } catch {
    // Si l'API n'est pas joignable au moment du build, les pages sont
    // produites à la demande plutôt que d'échouer.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const program = await getProgram(slug);
    return {
      title: program.title,
      description: program.description,
      openGraph: program.image ? { images: [{ url: program.image }] } : undefined,
    };
  } catch {
    return {};
  }
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const t = text('programs.detail');

  const program = await getOrNull(() => getProgram(slug));

  // Le slug désigne soit un programme, soit un domaine : l'arborescence du
  // guide place les deux au même niveau, et Next n'accepte qu'un segment
  // dynamique par emplacement.
  if (!program) {
    const domain = await getOrNull(() => getDomain(slug));
    if (!domain) notFound();
    return <DomainPage domain={domain} />;
  }

  const projects = program.projects ?? [];
  const events = program.events ?? [];

  return (
    <>
      <PageHero
        eyebrow={program.shortLabel}
        lines={[program.title]}
        lead={program.description}
      />

      <section className="container-page py-14 md:py-20">
        <Reveal from="none">
          <Link
            href="/programmes"
            className="link-sweep link-tap inline-flex items-center gap-2 text-sm font-medium text-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t('backLink')}
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-heading font-bold tracking-tight text-ink">
              {t('aboutTitle')}
            </h2>

            <div className="mt-5">
              <ProgramSections program={program} />
            </div>

            <div className="mt-9 rounded-panel border border-ink/10 bg-mist p-6">
              <h3 className="font-display text-base font-bold tracking-tight text-ink">
                {t('ctaTitle')}
              </h3>
              <p className="mt-2 text-[0.9375rem] text-muted">{t('ctaBody')}</p>
              <ActionLink
                href={`/communaute/donateur?programme=${program.slug}`}
                className="mt-5"
                size="sm"
              >
                {program.shortLabel}
              </ActionLink>
            </div>
          </div>

          <ParallaxMedia
            src={program.image ?? '/images/home/hero.jpg'}
            alt={program.title}
            className="aspect-4/3 rounded-card lg:aspect-3/4"
            sizes="(max-width: 1024px) 100vw, 42vw"
          />
        </div>
      </section>

      {events.length > 0 && (
        <section className="container-page pb-4">
          <h2 className="font-display text-title font-bold tracking-tight text-ink">
            Ce que nous avons réalisé
          </h2>
          <ProgramEvents events={events} />
        </section>
      )}

      <section className="bg-mist py-16 md:py-24">
        <div className="container-page">
          <h2 className="font-display text-title font-bold tracking-tight text-ink">
            {t('projectsTitle')}
          </h2>

          {projects.length > 0 ? (
            <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.09}>
              {projects.map((project) => (
                <RevealItem key={project.id}>
                  <ProjectCard project={{ ...project, program: program }} />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <p className="mt-5 text-[0.9375rem] text-muted">{t('noProjects')}</p>
          )}
        </div>
      </section>
    </>
  );
}
