import type { Metadata } from 'next';
import { text } from '@/lib/text';
import Link from 'next/link';
import { getDomains, getPrograms, getProjects, getStats, getTestimonials } from '@/lib/api';
import type { Project, ProjectStatus } from '@/lib/types';
import { PageHero } from '@/components/blocks/PageHero';
import { ProjectCard } from '@/components/blocks/ProjectCard';
import { SdgBadges } from '@/components/blocks/SdgBadges';
import { StatTile } from '@/components/blocks/StatTile';
import { FilterBar } from '@/components/ui/FilterBar';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { headingLines } from '@/lib/heading';
import { formatDate } from '@/lib/format';

export function generateMetadata(): Metadata {
  const t = text('projects');
  return { title: t('eyebrow'), description: t('lead') };
}

/**
 * Ordre d'affichage des états : les réussites d'abord.
 *
 * Le cahier des charges en fait une règle et non une préférence — on démontre
 * l'efficacité des actions passées avant de solliciter un financement.
 */
const ORDRE: ProjectStatus[] = ['REALISE', 'EN_COURS', 'A_FINANCER', 'EN_PREPARATION'];

const TITRES: Record<ProjectStatus, string> = {
  REALISE: 'completedTitle',
  EN_COURS: 'ongoingTitle',
  A_FINANCER: 'fundingTitle',
  EN_PREPARATION: 'preparationTitle',
};

/** Étiquette d'état du tableau de synthèse. */
const TONS: Record<ProjectStatus, string> = {
  REALISE: 'bg-leaf/12 text-leaf',
  EN_COURS: 'bg-gold/25 text-ink',
  A_FINANCER: 'bg-red-50 text-red-800',
  EN_PREPARATION: 'bg-ink/8 text-muted',
};

function periode(project: Project): string {
  if (!project.startDate) return ' - ';
  const debut = formatDate(project.startDate);
  return project.endDate ? `${debut} - ${formatDate(project.endDate)}` : debut;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ programme?: string; etat?: string }>;
}) {
  const { programme, etat } = await searchParams;

  const t = text('projects');

  const [programs, projects, testimonials, stats, domains] = await Promise.all([
    getPrograms(),
    getProjects({ program: programme, limit: 60 }),
    getTestimonials(),
    getStats(),
    getDomains(),
  ]);

  const tous = projects.items;

  // L'état retenu n'est pris en compte que s'il existe : une adresse bricolée
  // à la main ne doit pas vider la page sans explication.
  const etatRetenu = ORDRE.includes(etat as ProjectStatus) ? (etat as ProjectStatus) : undefined;
  const filtres = etatRetenu ? tous.filter((p) => p.status === etatRetenu) : tous;

  const parEtat = ORDRE.map((statut) => ({
    statut,
    liste: filtres.filter((project) => project.status === statut),
  })).filter(({ liste }) => liste.length > 0);

  const compte = (statut: ProjectStatus) => tous.filter((p) => p.status === statut).length;

  // Les ODD ciblés se déduisent des domaines d'intervention : la liste reste
  // juste le jour où l'association en ajoute un, sans retoucher au code.
  const oddCibles = [...new Set(domains.flatMap((domaine) => domaine.sdgs))].sort((a, b) => a - b);

  // Le témoignage du bandeau bas est celui d'un bénéficiaire, à défaut le premier.
  const quote =
    testimonials.find((testimonial) => testimonial.type === 'BENEFICIARY') ?? testimonials[0];

  // Les puces de filtre et leur constructeur d'adresse ont laissé place au
  // formulaire en GET de `FilterBar`, qui compose l'URL lui-même.

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} lines={headingLines(t('title'))} lead={t('lead')} />

      {/* ── Filtres ───────────────────────────────────────────────────── */}
      {/* En listes déroulantes : à quatre états et huit programmes, les
          puces occupaient deux lignes entières avant le premier projet. */}
      <section className="border-b border-ink/10 bg-mist py-6">
        <FilterBar
          action="/projets"
          filtres={[
            {
              nom: 'etat',
              label: 'État du projet',
              tous: t('all'),
              valeur: etatRetenu,
              options: ORDRE.filter((statut) => compte(statut) > 0).map((statut) => ({
                value: statut,
                // Le compte accompagne l'état : on sait ce qu'on va trouver
                // avant d'ouvrir la liste.
                label: `${t(`status.${statut}`)} (${compte(statut)})`,
              })),
            },
            {
              nom: 'programme',
              label: 'Programme',
              tous: 'Tous les programmes',
              valeur: programme,
              options: programs.map((program) => ({
                value: program.slug,
                label: program.shortLabel,
              })),
            },
          ]}
        />
      </section>


      {/* ── En-tête d'impact global ───────────────────────────────────── */}
      <section className="container-page py-14 md:py-20">
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.09}>
          <RevealItem>
            <StatTile value={compte('REALISE')} label={t('impact.completed')} tone="gold" />
          </RevealItem>
          <RevealItem>
            <StatTile value={compte('EN_COURS')} label={t('impact.ongoing')} />
          </RevealItem>
          <RevealItem>
            <StatTile value={stats.peopleHelped} suffix="+" label={t('impact.people')} />
          </RevealItem>
          <RevealItem>
            <StatTile value={stats.communities} label={t('impact.communities')} />
          </RevealItem>
        </RevealGroup>
      </section>

      {/* ── Grilles par état, réussites en premier ────────────────────── */}
      <section className="container-page pb-16 md:pb-24">
        {parEtat.length === 0 ? (
          <p className="text-[0.9375rem] text-muted">{t('empty')}</p>
        ) : (
          <div className="space-y-16">
            {parEtat.map(({ statut, liste }) => (
              <div key={statut}>
                <Reveal from="none">
                  <h2
                    id={`etat-${statut.toLowerCase()}`}
                    className="scroll-mt-28 font-display text-title font-bold tracking-tight text-ink"
                  >
                    {t(TITRES[statut])}
                  </h2>
                </Reveal>

                <RevealGroup
                  className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                  stagger={0.07}
                  as="ul"
                >
                  {liste.map((project) => (
                    <RevealItem key={project.id} as="li">
                      <ProjectCard project={project} />
                    </RevealItem>
                  ))}
                </RevealGroup>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Tableau de synthèse ───────────────────────────────────────── */}
      {filtres.length > 0 && (
        <section className="bg-mist py-16 md:py-24">
          <div className="container-page">
            <Reveal from="none">
              <h2 className="font-display text-title font-bold tracking-tight text-ink">
                {t('summary.title')}
              </h2>
              <p className="mt-3 max-w-3xl text-[0.9375rem] leading-relaxed text-muted">
                {t('summary.lead')}
              </p>
            </Reveal>

            {/* Le tableau défile dans son propre cadre : la page ne déborde pas
                sur un écran de téléphone. */}
            <div className="mt-8 overflow-x-auto rounded-card border border-ink/10 bg-paper">
              <table className="w-full min-w-176 border-collapse text-left text-[0.875rem]">
                <caption className="sr-only">{t('summary.title')}</caption>
                <thead>
                  <tr className="border-b border-ink/10 bg-fog">
                    <th scope="col" className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink">
                      {t('summary.project')}
                    </th>
                    <th scope="col" className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink">
                      {t('summary.program')}
                    </th>
                    <th scope="col" className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink">
                      {t('summary.place')}
                    </th>
                    <th scope="col" className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink">
                      {t('summary.period')}
                    </th>
                    <th scope="col" className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink">
                      {t('summary.state')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ORDRE.flatMap((statut) =>
                    filtres.filter((project) => project.status === statut),
                  ).map((project) => (
                    <tr key={project.id} className="border-b border-ink/8 last:border-0">
                      <th scope="row" className="px-4 py-3 align-middle font-normal">
                        {/* `link-tap` porte la cible à 24 px de haut : sans
                            elle, le lien ne mesurait que 18 px sur un
                            téléphone, sous le minimum tactile. */}
                        <Link
                          href={`/projets/${project.slug}`}
                          className="link-sweep link-tap font-display font-semibold text-ink"
                        >
                          {project.title}
                        </Link>
                      </th>
                      <td className="px-4 py-3 align-middle text-muted">
                        {project.program?.shortLabel ?? ' - '}
                      </td>
                      <td className="px-4 py-3 align-middle text-muted">{project.location ?? ' - '}</td>
                      <td className="px-4 py-3 align-middle text-muted">{periode(project)}</td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-[0.75rem] font-semibold ${TONS[project.status]}`}
                        >
                          {t(`status.${project.status}`)}
                        </span>
                        {typeof project.progress === 'number' && (
                          <span className="ml-2 text-[0.75rem] text-muted tabular">
                            {project.progress}&nbsp;%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Objectifs de développement durable ────────────────────────── */}
      {oddCibles.length > 0 && (
        <section className="container-page py-16 md:py-24">
          <Reveal from="none">
            <h2 className="font-display text-title font-bold tracking-tight text-ink">
              {t('sdg.title')}
            </h2>
            <p className="mt-3 max-w-3xl text-[0.9375rem] leading-relaxed text-muted">
              {t('sdg.lead')}
            </p>
          </Reveal>

          <Reveal delay={0.12} className="mt-8">
            <SdgBadges sdgs={oddCibles} />
          </Reveal>
        </section>
      )}

      {quote && (
        <section className="bg-ink relative isolate overflow-hidden py-16 md:py-24">
          <div className="grain absolute inset-0" aria-hidden />

          <Reveal className="container-page relative text-center">
            <p className="eyebrow text-gold">{t('testimonialEyebrow')}</p>

            <blockquote className="mx-auto mt-6 max-w-4xl font-display text-2xl leading-snug font-bold tracking-tight text-paper md:text-3xl">
              «&nbsp;{quote.content}&nbsp;»
            </blockquote>

            <p className="mt-6 text-sm text-paper/55">
              {quote.name}
              {quote.role ? ` - ${quote.role}` : ''}
            </p>
          </Reveal>
        </section>
      )}
    </>
  );
}
