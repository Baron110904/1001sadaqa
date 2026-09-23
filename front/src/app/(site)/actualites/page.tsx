import type { Metadata } from 'next';
import { text } from '@/lib/text';
import Link from 'next/link';
import { getFeaturedNews, getNews, getNewsYears, getPrograms } from '@/lib/api';
import type { NewsCategory } from '@/lib/types';
import { NewsletterForm } from '@/components/forms/NewsletterForm';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHero } from '@/components/blocks/PageHero';
import { NewsCard } from '@/components/blocks/NewsCard';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { formatDate } from '@/lib/format';
import { headingLines } from '@/lib/heading';

export function generateMetadata(): Metadata {
  const t = text('news');
  return { title: t('eyebrow'), description: t('lead') };
}

const CATEGORIES: NewsCategory[] = ['TERRAIN', 'COMMUNIQUE', 'PARTENARIAT'];

/** Douze articles par page, comme le demande le cahier des charges. */
const PAR_PAGE = 12;

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    categorie?: string;
    annee?: string;
    q?: string;
    page?: string;
    programme?: string;
  }>;
}) {
  const params = await searchParams;

  const t = text('news');
  const tCategories = text('news.categories');

  const categorie = CATEGORIES.includes(params.categorie as NewsCategory)
    ? (params.categorie as NewsCategory)
    : undefined;
  const annee = Number(params.annee) || undefined;
  const recherche = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const programme = params.programme?.trim() || undefined;

  const filtre = Boolean(categorie || annee || recherche || programme);

  const [featured, list, annees, programmes] = await Promise.all([
    // L'article à la une n'a de sens que sur la liste non filtrée : filtrée,
    // il serait hors du périmètre demandé par le visiteur.
    filtre ? Promise.resolve(null) : getFeaturedNews(),
    getNews({
      limit: PAR_PAGE,
      page,
      category: categorie,
      q: recherche,
      year: annee,
      program: programme,
    }),
    getNewsYears(),
    getPrograms(),
  ]);

  // L'article mis en avant n'est pas répété dans la grille.
  const rest = list.items.filter((article) => article.id !== featured?.id);

  /** Conserve les autres dimensions du filtre, et revient page 1. */
  const lien = (
    suivant: Partial<Record<'categorie' | 'annee' | 'q' | 'page' | 'programme', string>>,
  ) => {
    const query = new URLSearchParams();
    const valeurs = {
      categorie: 'categorie' in suivant ? suivant.categorie : categorie,
      annee: 'annee' in suivant ? suivant.annee : annee ? String(annee) : undefined,
      q: 'q' in suivant ? suivant.q : recherche,
      programme: 'programme' in suivant ? suivant.programme : programme,
      page: suivant.page,
    };
    for (const [cle, valeur] of Object.entries(valeurs)) {
      if (valeur) query.set(cle, valeur);
    }
    return query.size ? `/actualites?${query}` : '/actualites';
  };


  return (
    <>
      <PageHero eyebrow={t('eyebrow')} lines={headingLines(t('title'))} lead={t('lead')} />

      {/* ── Barre de filtres et recherche ─────────────────────────────── */}
      <section className="border-b border-ink/10 bg-mist py-6">
        <FilterBar
          action="/actualites"
          recherche={recherche}
          placeholder={t('searchPlaceholder')}
          labelRecherche={t('searchLabel')}
          actionRecherche={t('searchAction')}
          filtres={[
            {
              nom: 'categorie',
              label: t('categoryFilter'),
              tous: t('allCategories'),
              valeur: categorie,
              options: CATEGORIES.map((valeur) => ({
                value: valeur,
                label: tCategories(valeur),
              })),
            },
            {
              nom: 'programme',
              label: t('programFilter'),
              tous: t('allPrograms'),
              valeur: programme,
              options: programmes.map((valeur) => ({
                value: valeur.slug,
                label: valeur.shortLabel,
              })),
            },
            {
              nom: 'annee',
              label: t('yearFilter'),
              tous: t('allYears'),
              valeur: annee ? String(annee) : undefined,
              options: annees.map((valeur) => ({
                value: String(valeur),
                label: String(valeur),
              })),
            },
          ]}
        />
      </section>

      <section className="container-page py-16 md:py-24">
        {/* ── Article à la une ────────────────────────────────────────── */}
        {featured && (
          <Reveal>
            <article className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
              <Link href={`/actualites/${featured.slug}`} className="group block">
                <MediaFrame
                  src={featured.image}
                  alt={featured.title}
                  placeholder={tCategories(featured.category)}
                  zoomOnHover
                  sizes="(max-width: 768px) 100vw, 48vw"
                  className="aspect-4/3 w-full"
                />
              </Link>

              <div>
                <p className="inline-flex rounded-full bg-gold px-3 py-1.5 font-display text-[0.6875rem] font-bold tracking-[0.14em] text-ink uppercase">
                  {t('featured')}
                </p>

                <h2 className="text-title mt-5 font-bold text-ink">
                  <Link href={`/actualites/${featured.slug}`} className="link-sweep">
                    {featured.title}
                  </Link>
                </h2>

                {featured.excerpt && (
                  <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
                    {featured.excerpt}
                  </p>
                )}

                {featured.publishedAt && (
                  <p className="mt-5 text-[0.8125rem] text-muted">
                    <time dateTime={featured.publishedAt}>
                      {formatDate(featured.publishedAt)}
                    </time>
                    {' · '}
                    {tCategories(featured.category)}
                  </p>
                )}
              </div>
            </article>
          </Reveal>
        )}

        {/* ── Liste ───────────────────────────────────────────────────── */}
        {filtre && (
          <p role="status" className="text-[0.9375rem] text-muted">
            {list.total} {list.total > 1 ? t('resultsPlural') : t('resultsSingular')}
            {recherche ? ` ${t('resultsFor')} « ${recherche} »` : ''}
          </p>
        )}

        {rest.length > 0 ? (
          <RevealGroup
            className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${featured ? 'mt-16' : 'mt-8'}`}
            stagger={0.07}
            as="ul"
          >
            {rest.map((article) => (
              <RevealItem key={article.id} as="li">
                <NewsCard article={article} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          !featured && <p className="mt-8 text-[0.9375rem] text-muted">{t('empty')}</p>
        )}

        {/* ── Pagination ──────────────────────────────────────────────── */}
        {list.pages > 1 && (
          <nav aria-label={t('pagination')} className="mt-14 flex flex-wrap justify-center gap-2">
            {Array.from({ length: list.pages }, (_, index) => index + 1).map((numero) => (
              <Link
                key={numero}
                href={lien({ page: numero === 1 ? undefined : String(numero) })}
                aria-current={numero === page ? 'page' : undefined}
                className={`flex size-10 items-center justify-center rounded-full border font-display text-[0.875rem] font-semibold transition-colors tabular ${
                  numero === page
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/15 text-ink hover:border-ink/40 hover:bg-mist'
                }`}
              >
                {numero}
              </Link>
            ))}
          </nav>
        )}
      </section>

      {/* ── Lettre d'information ────────────────────────────────────── */}
      {/* Deux colonnes : l'intention à gauche, le geste à droite dans sa
          propre carte. Empilés, le formulaire se perdait sous le texte. */}
      <section className="bg-mist py-14 md:py-20">
        <div className="container-page grid items-center gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="text-title font-display font-bold text-ink">
              {t('newsletter.title')}
            </h2>
            <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-muted">
              {t('newsletter.lead')}
            </p>
          </div>

          <div className="rounded-panel border border-ink/10 bg-paper p-6 md:p-8">
            <NewsletterForm source="actualites" />
          </div>
        </div>
      </section>

    </>
  );
}
