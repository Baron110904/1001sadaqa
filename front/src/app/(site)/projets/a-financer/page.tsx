import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getProjects } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { ProjectCard } from '@/components/blocks/ProjectCard';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';

export const metadata: Metadata = {
  title: 'Projets à financer',
  description:
    'Les projets prêts à démarrer qui attendent un financement : banque alimentaire, protection de l’enfance, autonomisation, eau et santé communautaire.',
};

export const revalidate = 300;

/**
 * Entrée B2B (§5.2).
 *
 * Les entreprises et institutions arrivent le plus souvent par LinkedIn et
 * cherchent directement ce qu'elles peuvent financer : cette adresse leur
 * évite de traverser toute la page Projets pour y parvenir.
 */
export default async function ProjectsToFundPage() {
  const { items } = await getProjects({ limit: 50 });
  const aFinancer = items.filter((projet) => projet.status === 'A_FINANCER');

  return (
    <>
      <PageHero
        eyebrow="Projets à financer"
        lines={['Des projets prêts,', 'qui attendent un financement']}
        lead="Chacun a été conçu, chiffré et rattaché à un programme. Il ne manque que les moyens de le mener."
      />

      <section className="container-page py-14 md:py-20">
        <Reveal from="none">
          <Link
            href="/projets"
            className="link-sweep link-tap inline-flex items-center gap-2 text-sm font-medium text-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Tous nos projets
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
            Aucun projet n’attend de financement pour le moment. Vous pouvez soutenir un programme
            en cours depuis la page Communauté.
          </p>
        )}
      </section>
    </>
  );
}
