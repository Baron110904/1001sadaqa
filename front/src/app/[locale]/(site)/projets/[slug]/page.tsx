import type { Metadata } from 'next';
import { text } from '@/lib/text';
import { notFound } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Clock, Download, FileText } from 'lucide-react';
import Link from 'next/link';
import { getOrNull, getProject, getProjects } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { SdgBadges } from '@/components/blocks/SdgBadges';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { ActionLink } from '@/components/ui/Button';
import { ParallaxMedia } from '@/components/motion/ParallaxMedia';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { formatDate, formatXof, toParagraphs } from '@/lib/format';

export async function generateStaticParams() {
  try {
    const projects = await getProjects({ limit: 60 });
    return projects.items.map((project) => ({ slug: project.slug }));
  } catch {
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
    const project = await getProject(slug);
    return {
      title: project.title,
      description: project.description,
      openGraph: project.image ? { images: [{ url: project.image }] } : undefined,
    };
  } catch {
    return {};
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const t = text('projects.detail');
  const tProjects = text('projects');

  const project = await getOrNull(() => getProject(slug));
  if (!project) notFound();

  const paragraphs = project.content ? toParagraphs(project.content) : [];

  // Le budget ne s'affiche que si sa visibilité l'autorise : le dossier
  // institutionnel écrit « budget disponible » sans publier de chiffre, et la
  // décision se prend projet par projet. `PARTENAIRE` est réservé à l'espace
  // connecté, qui n'existe pas encore — on ne le publie donc pas ici.
  const budgetPublic = project.budgetVisibility === 'PUBLIC' && project.budget !== null;

  const facts = [
    project.program && { label: t('programLabel'), value: project.program.title },
    project.location && { label: t('locationLabel'), value: project.location },
    project.startDate && {
      label: t('periodLabel'),
      value: `${formatDate(project.startDate)}${
        project.endDate ? ` - ${formatDate(project.endDate)}` : ''
      }`,
    },
    budgetPublic && { label: t('budgetLabel'), value: formatXof(project.budget as number) },
  ].filter(Boolean) as { label: string; value: string }[];

  // Les rubriques de la fiche (§5.4), dans l'ordre de lecture du guide : le
  // besoin, puis ce qu'on vise, puis qui est accompagné.
  const rubriques = [
    project.problem && { titre: t('problemTitle'), corps: project.problem },
    project.objectives && { titre: t('objectivesTitle'), corps: project.objectives },
    project.audience && { titre: t('audienceTitle'), corps: project.audience },
  ].filter(Boolean) as { titre: string; corps: string }[];

  return (
    <>
      <PageHero
        eyebrow={`${project.program?.shortLabel ?? ''} · ${tProjects(`status.${project.status}`)}`}
        lines={[project.title]}
        lead={project.description}
      />

      <section className="container-page py-14 md:py-20">
        <Reveal from="none">
          <Link
            href="/projets"
            className="link-sweep link-tap inline-flex items-center gap-2 text-sm font-medium text-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t('backLink')}
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <ParallaxMedia
              src={project.image ?? '/images/home/hero.jpg'}
              alt={project.title}
              className="aspect-16/10 rounded-card"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />

            {/* Les rubriques structurées passent avant le texte libre : c'est
                ce qui rend les fiches comparables entre elles. */}
            {rubriques.length > 0 && (
              <div className="mt-9 space-y-8">
                {rubriques.map((rubrique) => (
                  <div key={rubrique.titre}>
                    <h2 className="font-display text-heading font-bold tracking-tight text-ink">
                      {rubrique.titre}
                    </h2>
                    <div className="mt-3 space-y-3">
                      {toParagraphs(rubrique.corps).map((paragraph, index) => (
                        <p key={index} className="text-[0.9375rem] leading-relaxed text-muted">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {paragraphs.length > 0 && (
              <div className="mt-9 space-y-4">
                {paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-[0.9375rem] leading-relaxed text-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {project.sdgs.length > 0 && (
              <div className="mt-10 border-t border-ink/10 pt-8">
                <h2 className="font-display text-heading font-bold tracking-tight text-ink">
                  {tProjects('sdg.projectTitle')}
                </h2>
                <SdgBadges sdgs={project.sdgs} className="mt-4" />
              </div>
            )}
          </div>

          <aside className="space-y-8">
            {/* L'avancement porte la date de sa dernière mise à jour : un
                pourcentage sans date ne veut rien dire pour un bailleur. */}
            {typeof project.progress === 'number' && (
              <div className="rounded-card border border-ink/10 bg-paper p-6">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-[0.9375rem] font-bold tracking-tight text-ink">
                    {t('progressLabel')}
                  </span>
                  <span className="font-display text-2xl font-bold tracking-tight text-ink tabular">
                    {project.progress}&nbsp;%
                  </span>
                </p>

                <div
                  className="mt-4 h-2 overflow-hidden rounded-full bg-ink/8"
                  role="progressbar"
                  aria-valuenow={project.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('progressLabel')}
                >
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
                  />
                </div>

                {project.progressAt && (
                  <p className="mt-3 text-[0.75rem] text-muted">
                    {t('progressAt')} {formatDate(project.progressAt)}
                  </p>
                )}
              </div>
            )}

            {facts.length > 0 && (
              <dl className="rounded-card border border-ink/10 bg-mist p-6">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/10 py-3 last:border-0 last:pb-0 first:pt-0"
                  >
                    <dt className="text-[0.8125rem] text-muted">{fact.label}</dt>
                    <dd className="text-right text-[0.9375rem] font-semibold text-ink">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {project.impacts.length > 0 && (
              <div>
                <h2 className="font-display text-heading font-bold tracking-tight text-ink">
                  {t('impactTitle')}
                </h2>

                <RevealGroup className="mt-5 space-y-3" stagger={0.09} as="ul">
                  {project.impacts.map((impact) => (
                    <RevealItem key={impact.id} as="li">
                      <div className="rounded-card border border-ink/10 bg-paper p-5">
                        <p className="flex items-baseline gap-2">
                          <span className="font-display text-2xl font-bold tracking-tight text-ink tabular">
                            {impact.value}
                          </span>
                          <span className="text-sm text-muted">{impact.indicator}</span>
                        </p>

                        {/* La vérification est affichée telle qu'elle est en base :
                            un chiffre non vérifié ne se présente pas comme vérifié. */}
                        <p
                          className={`mt-2.5 inline-flex items-center gap-1.5 text-[0.75rem] font-medium ${
                            impact.verified ? 'text-leaf' : 'text-muted'
                          }`}
                        >
                          {impact.verified ? (
                            <BadgeCheck className="size-3.5" aria-hidden />
                          ) : (
                            <Clock className="size-3.5" aria-hidden />
                          )}
                          {impact.verified ? t('verified') : t('unverified')}
                        </p>
                      </div>
                    </RevealItem>
                  ))}
                </RevealGroup>
              </div>
            )}

            {/* L'appel à l'action suit l'état du projet : on ne propose pas de
                financer un projet déjà réalisé, ni de donner pour un projet
                qui n'a pas encore démarré. */}
            <div className="rounded-panel bg-ink p-6">
              <h2 className="font-display text-base font-bold tracking-tight text-paper">
                {t('ctaTitle')}
              </h2>
              <p className="mt-2 text-[0.9375rem] text-paper/70">{t('ctaBody')}</p>
              <ActionLink
                href={
                  project.status === 'EN_PREPARATION'
                    ? '/contact'
                    : project.program
                      ? `/communaute/donateur?programme=${project.program.slug}`
                      : '/communaute/donateur'
                }
                size="sm"
                className="mt-5"
              >
                {tProjects(`statusCta.${project.status}`)}
              </ActionLink>
            </div>
          </aside>
        </div>

        {project.gallery.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-heading font-bold tracking-tight text-ink">
              {t('galleryTitle')}
            </h2>

            <RevealGroup
              className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4"
              stagger={0.07}
              as="ul"
            >
              {project.gallery.map((url) => (
                <RevealItem key={url} as="li">
                  <MediaFrame
                    src={url}
                    alt={project.title}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="aspect-square w-full"
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        )}

        {/* ── Vidéos de terrain ───────────────────────────────────────── */}
        {/* Chargement différé : la vidéo ne se télécharge qu'à la demande, ce
            qui évite d'imposer plusieurs mégaoctets à une connexion mobile
            pour une page que le visiteur ne regardera peut-être pas. */}
        {project.videos.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-heading font-bold tracking-tight text-ink">
              Vidéos de terrain
            </h2>

            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {project.videos.map((url) => (
                <li key={url} className="overflow-hidden rounded-card border border-ink/10">
                  <div className="aspect-video">
                    <iframe
                      src={url}
                      title={`Vidéo de terrain - ${project.title}`}
                      loading="lazy"
                      allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                      allowFullScreen
                      className="size-full border-0"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Documents à télécharger ─────────────────────────────────── */}
        {/* Seuls les documents publics remontent de l'API : un document
            réservé aux partenaires n'a rien à faire sur une page ouverte. */}
        {(project.documents?.length ?? 0) > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-heading font-bold tracking-tight text-ink">
              Documents à télécharger
            </h2>

            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {project.documents?.map((fichier) => (
                <li key={fichier.id}>
                  <a
                    href={fichier.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-4 rounded-card border border-ink/10 bg-paper p-4 transition-colors hover:border-ink/30 hover:bg-mist"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-fog text-leaf">
                      <FileText className="size-5" strokeWidth={2} aria-hidden />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[0.9375rem] font-semibold text-ink">
                        {fichier.title}
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] text-muted">
                        {fichier.fileType}
                        {fichier.fileSize ? ` · ${fichier.fileSize}` : ''}
                      </span>
                    </span>

                    <Download
                      className="size-4 shrink-0 text-muted transition-transform group-hover:translate-y-0.5"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}
