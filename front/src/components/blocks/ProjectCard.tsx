import { text } from '@/lib/text';
import Link from 'next/link';
import { MediaFrame } from '@/components/ui/MediaFrame';
import type { Project } from '@/lib/types';

/**
 * Carte projet.
 *
 * L'indicateur mis en avant vient de l'impact marqué `isPrimary` en base ;
 * à défaut, du premier impact enregistré. Si le projet n'a pas encore
 * d'indicateur, le pied de carte disparaît plutôt que d'afficher un zéro.
 */
export async function ProjectCard({ project }: { project: Project }) {
  const t = text('common');
  const primary = project.impacts.find((impact) => impact.isPrimary) ?? project.impacts[0];
  const done = project.status === 'REALISE';

  return (
    <Link
      href={`/projets/${project.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-ink/10 bg-paper transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-gold/45 hover:shadow-lift"
    >
      <MediaFrame
        src={project.image}
        alt={project.title}
        placeholder={project.program?.shortLabel ?? project.title}
        rounded="rounded-none"
        zoomOnHover
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="aspect-4/3 w-full"
      />

      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow flex items-center gap-2 text-leaf">
          {project.program?.shortLabel}
          <span aria-hidden className="text-ink/25">
            ·
          </span>
          <span className={done ? 'text-muted' : 'text-gold-deep'}>
            {done ? t('completed') : t('inProgress')}
          </span>
        </p>

        <h3 className="mt-2.5 font-display text-[1.0625rem] leading-snug font-bold tracking-tight text-ink">
          {project.title}
        </h3>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{project.description}</p>

        {primary && (
          <p className="mt-5 flex items-baseline gap-2 border-t border-ink/10 pt-4">
            <span className="font-display text-2xl font-bold tracking-tight text-ink tabular">
              {primary.value}
            </span>
            <span className="text-sm text-muted">{primary.indicator}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
