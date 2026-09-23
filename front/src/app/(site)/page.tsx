import { text } from '@/lib/text';
import { ArrowRight, HandCoins, HandHeart, Handshake, Stethoscope, UserPlus } from 'lucide-react';
import Link from 'next/link';
import {
  getCampaigns,
  getFoodbank,
  getNews,
  getPrograms,
  getProjects,
  getSeasonalCampaign,
  getStats,
  getTestimonials,
} from '@/lib/api';
import { hasHero } from '@/lib/seasonal';
import { HomeHero } from '@/components/blocks/HomeHero';
import { SeasonalHero, SeasonalMarquee } from '@/components/seasonal/SeasonalHero';
import { SeasonalOffers } from '@/components/seasonal/SeasonalOffers';
import { ProgramCard } from '@/components/blocks/ProgramCard';
import { ProjectCard } from '@/components/blocks/ProjectCard';
import { CampaignCard } from '@/components/blocks/CampaignCard';
import { NewsCard } from '@/components/blocks/NewsCard';
import { TestimonialCard } from '@/components/blocks/TestimonialCard';
import { StatTile } from '@/components/blocks/StatTile';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { ActionLink } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import { Marquee } from '@/components/motion/Marquee';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Counter } from '@/components/motion/Counter';
import { ParallaxMedia } from '@/components/motion/ParallaxMedia';
import { headingLines } from '@/lib/heading';

export default async function HomePage() {
  const t = text('home');
  const tCommon = text('common');
  const tProjects = text('projects');

  // Les lectures partent en parallèle : le rendu attend la plus lente, pas
  // leur somme.
  const [programs, campaigns, testimonials, news, stats, featuredProjects, seasonal, banque] =
    await Promise.all([
      getPrograms(),
      getCampaigns(),
      getTestimonials(),
      getNews({ limit: 3 }),
      getStats(),
      getProjects({ limit: 4 }),
      getSeasonalCampaign(),
      getFoodbank(),
    ]);

  // L'habillage de fête remplace le héros habituel plutôt que de s'y ajouter :
  // deux bandeaux plein-écran l'un sur l'autre repousseraient le contenu hors
  // de vue. Le reste de la page est inchangé.
  const festif = hasHero(seasonal) ? (seasonal as NonNullable<typeof seasonal>) : null;

  return (
    <>
      {festif ? <SeasonalHero campaign={festif} /> : <HomeHero />}

      {festif ? (
        <>
          <SeasonalMarquee campaign={festif} />
          <SeasonalOffers campaign={festif} />
        </>
      ) : (
        <Marquee text={t('marquee')} />
      )}

      {/* ── Qui sommes-nous ───────────────────────────────────────────── */}
      <section className="container-page py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="grid grid-cols-2 gap-4">
            <ParallaxMedia
              src="/images/home/about-accompagnement.jpg"
              alt={t('media.accompaniment')}
              className="col-span-2 aspect-16/10 rounded-card"
              sizes="(max-width: 1024px) 100vw, 42vw"
              amount={7}
            />

            <MediaFrame
              src="/images/home/about-distribution.jpg"
              alt={t('media.distribution')}
              sizes="(max-width: 1024px) 50vw, 21vw"
              className="aspect-square"
            />

            <Reveal from="right">
              <div className="flex h-full flex-col justify-end rounded-card bg-gold p-5">
                <p className="font-display text-4xl leading-none font-bold tracking-tight text-ink">
                  <Counter value={stats.projects} />
                </p>
                <p className="mt-2 text-[0.8125rem] font-semibold text-ink">
                  {t('about.projectsLabel')}
                </p>
              </div>
            </Reveal>
          </div>

          <div>
            <SectionHeading
              eyebrow={t('about.eyebrow')}
              lines={headingLines(t('about.title'))}
              lead={t('about.body')}
            />

            <RevealGroup className="mt-9 grid gap-4 sm:grid-cols-2" stagger={0.1}>
              <RevealItem>
                <div className="h-full rounded-card border border-ink/10 p-5">
                  <span className="flex size-10 items-center justify-center rounded-card bg-fog text-leaf">
                    <Stethoscope className="size-5" strokeWidth={2} aria-hidden />
                  </span>
                  <p className="mt-4 font-display text-base font-bold tracking-tight text-ink">
                    {t('about.featureTitle')}
                  </p>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">
                    {t('about.featureBody')}
                  </p>
                </div>
              </RevealItem>

              <RevealItem>
                <StatTile
                  value={stats.peopleHelped}
                  suffix="+"
                  label={t('about.peopleLabel')}
                  description={t('about.peopleBody')}
                />
              </RevealItem>
            </RevealGroup>

            <Reveal delay={0.2} className="mt-8">
              <ActionLink href="/a-propos" variant="dark">
                {t('about.cta')}
              </ActionLink>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Nos domaines d'action ─────────────────────────────────────── */}
      {programs.length > 0 && (
        <section className="bg-mist py-20 md:py-28">
          <div className="container-page">
            <SectionHeading
              eyebrow={t('programs.eyebrow')}
              lines={headingLines(t('programs.title'))}
              lead={t('programs.lead')}
              align="center"
            />

            <RevealGroup
              className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              stagger={0.09}
            >
              {programs.slice(0, 4).map((program) => (
                <RevealItem key={program.id}>
                  <ProgramCard program={program} />
                </RevealItem>
              ))}
            </RevealGroup>

            {programs.length > 4 && (
              <Reveal delay={0.18} className="mt-10 flex justify-center">
                <ActionLink href="/programmes" variant="ghost">
                  {tCommon('seeAll')}
                </ActionLink>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ── Nos projets & réalisations ────────────────────────────────── */}
      {/* Placée juste après les domaines : le visiteur voit la preuve des
          actions avant tout le reste. */}
      {featuredProjects.items.length > 0 && (
        <section className="bg-sand py-20 md:py-28">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow={tProjects('eyebrow')}
                lines={headingLines(tProjects('title'))}
              />

              <Reveal from="right">
                <ActionLink href="/projets" variant="dark">
                  {tCommon('seeAll')}
                </ActionLink>
              </Reveal>
            </div>

            <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.09}>
              {featuredProjects.items.map((project) => (
                <RevealItem key={project.id}>
                  <ProjectCard project={project} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* ── Ce que nous faisons ───────────────────────────────────────── */}
      <section className="container-page py-20 md:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow={t('whatWeDo.eyebrow')}
              lines={headingLines(t('whatWeDo.title'))}
            />

            <Reveal delay={0.16} className="mt-9">
              <Accordion
                items={[
                  {
                    id: 'empowerment',
                    title: t('whatWeDo.items.empowerment.title'),
                    body: t('whatWeDo.items.empowerment.body'),
                  },
                  {
                    id: 'emergency',
                    title: t('whatWeDo.items.emergency.title'),
                    body: t('whatWeDo.items.emergency.body'),
                  },
                  {
                    id: 'longTerm',
                    title: t('whatWeDo.items.longTerm.title'),
                    body: t('whatWeDo.items.longTerm.body'),
                  },
                ]}
              />
            </Reveal>
          </div>

          <ParallaxMedia
            src="/images/home/atelier-formation.jpg"
            alt={t('media.training')}
            className="aspect-4/3 rounded-card lg:aspect-square"
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
        </div>
      </section>

      {/* ── Causes à soutenir ─────────────────────────────────────────── */}
      {campaigns.length > 0 && (
        <section className="bg-ink-gradient relative isolate overflow-hidden py-20 md:py-28">
          <div className="grain absolute inset-0" aria-hidden />

          <div className="container-page relative">
            <SectionHeading
              eyebrow={t('causes.eyebrow')}
              lines={headingLines(t('causes.title'))}
              align="center"
              tone="light"
            />

            <RevealGroup className="mt-14 grid gap-5 md:grid-cols-3" stagger={0.1}>
              {campaigns.slice(0, 3).map((campaign) => (
                <RevealItem key={campaign.id}>
                  <CampaignCard campaign={campaign} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* ── Témoignages ──────────────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="container-page py-20 md:py-28">
          <SectionHeading
            eyebrow={t('testimonials.eyebrow')}
            lines={headingLines(t('testimonials.title'))}
            align="center"
          />

          <RevealGroup className="mt-14 grid gap-4 md:grid-cols-3" stagger={0.1}>
            {testimonials.slice(0, 3).map((testimonial) => (
              <RevealItem key={testimonial.id}>
                <TestimonialCard testimonial={testimonial} />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}

      {/* ── Banque alimentaire ───────────────────────────────────────── */}
      {/* Les chiffres viennent de l'entrepôt, pas d'un texte à tenir à jour :
          une banque alimentaire se juge à ce qu'elle a en réserve, et une
          page qui l'annoncerait de mémoire finirait par mentir. */}
      <section className="bg-ink py-20 md:py-28">
        <div className="container-page grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow text-gold">Banque alimentaire</p>
            <h2 className="text-title mt-4 font-display font-bold text-paper">
              Une réserve ouverte,{' '}
              <span className="text-gold">et un registre que chacun peut lire</span>
            </h2>
            <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-paper/70">
              Nous collectons, stockons et redistribuons des denrées aux familles accompagnées.
              Chaque entrée et chaque sortie est inscrite au registre : un donateur retrouve son
              apport.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ActionLink href="/banque-alimentaire" variant="primary">
                Rejoindre la banque alimentaire
              </ActionLink>
              <Link
                href="/banque-alimentaire/apporter"
                className="inline-flex items-center rounded-full border border-paper/25 px-6 py-3.5 font-display text-[0.9375rem] font-semibold text-paper transition-colors hover:border-paper/60 hover:bg-paper/8"
              >
                Apporter une denrée
              </Link>
            </div>
          </Reveal>

          <RevealGroup className="grid grid-cols-2 gap-4 self-center" stagger={0.09}>
            {[
              {
                valeur: banque.categories.length,
                label: 'articles suivis en réserve',
              },
              {
                valeur: banque.needs.length,
                label: banque.needs.length > 1 ? 'articles à renflouer' : 'article à renflouer',
              },
            ].map((tuile) => (
              <RevealItem key={tuile.label}>
                <div className="rounded-panel border border-paper/12 bg-paper/6 p-6 backdrop-blur-sm">
                  <p className="font-display text-5xl leading-none font-bold tracking-tight text-gold tabular">
                    <Counter value={tuile.valeur} />
                  </p>
                  <p className="mt-3 text-[0.875rem] leading-snug text-paper/65">{tuile.label}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Rejoindre la communauté ──────────────────────────────────── */}
      {/* Les quatre parcours d'engagement côte à côte : le visiteur convaincu
          par les témoignages trouve ici son point d'entrée, quel qu'il soit. */}
      <section className="bg-mist py-20 md:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow={t('join.eyebrow')}
            lines={headingLines(t('join.title'))}
            lead={t('join.lead')}
            align="center"
          />

          <RevealGroup
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.09}
          >
            {(
              [
                { key: 'member', href: '/communaute/membre', Icon: UserPlus },
                { key: 'volunteer', href: '/communaute/benevole', Icon: HandHeart },
                { key: 'partner', href: '/communaute/partenaire', Icon: Handshake },
                { key: 'donor', href: '/communaute/donateur', Icon: HandCoins },
              ] as const
            ).map(({ key, href, Icon }) => (
              <RevealItem key={key}>
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-card border border-ink/10 bg-paper p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/45 hover:shadow-soft"
                >
                  <span className="flex size-11 items-center justify-center rounded-card bg-fog text-leaf transition-colors group-hover:bg-gold group-hover:text-ink">
                    <Icon className="size-5" strokeWidth={2} aria-hidden />
                  </span>

                  <p className="mt-5 font-display text-base font-bold tracking-tight text-ink">
                    {t(`join.paths.${key}.title`)}
                  </p>
                  <p className="mt-2 flex-1 text-[0.8125rem] leading-relaxed text-muted">
                    {t(`join.paths.${key}.body`)}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-2 font-display text-[0.8125rem] font-semibold text-ink">
                    {t(`join.paths.${key}.cta`)}
                    <ArrowRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Actualités ───────────────────────────────────────────────── */}
      {news.items.length > 0 && (
        <section className="container-page py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow={t('news.eyebrow')}
              lines={headingLines(t('news.title'))}
            />

            <Reveal from="right">
              <Link
                href="/actualites"
                className="link-sweep link-tap inline-flex items-center gap-2 font-display text-sm font-semibold text-ink"
              >
                {tCommon('seeAll')}
                <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
              </Link>
            </Reveal>
          </div>

          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
            {news.items.map((article) => (
              <RevealItem key={article.id}>
                <NewsCard article={article} />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}

    </>
  );
}
