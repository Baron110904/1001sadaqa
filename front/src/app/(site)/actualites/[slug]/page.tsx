import type { Metadata } from 'next';
import { text } from '@/lib/text';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronRight, Clock, Facebook, Linkedin, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { getArticle, getNews, getOrNull } from '@/lib/api';
import type { NewsCategory } from '@/lib/types';
import { NewsCard } from '@/components/blocks/NewsCard';
import { ActionLink } from '@/components/ui/Button';
import { ParallaxMedia } from '@/components/motion/ParallaxMedia';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { formatDate, toParagraphs } from '@/lib/format';

export async function generateStaticParams() {
  try {
    const news = await getNews({ limit: 60 });
    return news.items.map((article) => ({ slug: article.slug }));
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
    const article = await getArticle(slug);
    return {
      title: article.title,
      description: article.excerpt ?? undefined,
      openGraph: {
        type: 'article',
        publishedTime: article.publishedAt ?? undefined,
        images: article.image ? [{ url: article.image }] : undefined,
      },
    };
  } catch {
    return {};
  }
}

/**
 * Appel à l'action selon le thème de l'article.
 *
 * Un compte rendu de terrain appelle un don, une annonce de partenariat appelle
 * un partenariat : proposer la même chose partout revient à ne rien proposer.
 */
const APPELS: Record<NewsCategory, { href: string; cle: string }> = {
  TERRAIN: { href: '/communaute/donateur', cle: 'donate' },
  COMMUNIQUE: { href: '/communaute/benevole', cle: 'volunteer' },
  PARTENARIAT: { href: '/communaute/partenaire', cle: 'partner' },
  INSTITUTION: { href: '/communaute/partenaire', cle: 'partner' },
};

/**
 * Temps de lecture estimé, en minutes.
 *
 * Deux cents mots par minute : la moyenne admise pour une lecture attentive en
 * français. Une minute au minimum, pour ne pas afficher « 0 min ».
 */
function tempsDeLecture(contenu: string): number {
  const mots = contenu.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(mots / 200));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const t = text('news.detail');
  const tCategories = text('news.categories');

  const article = await getOrNull(() => getArticle(slug));
  if (!article) notFound();

  // Les recommandations viennent de la même catégorie ; on complète avec les
  // plus récentes si la catégorie n'en compte pas assez. Les deux lectures
  // partent ensemble : la seconde ne sert qu'en complément.
  const [memeTheme, recents] = await Promise.all([
    getNews({ category: article.category, limit: 4 }),
    getNews({ limit: 6 }),
  ]);

  const paragraphs = toParagraphs(article.content);
  const minutes = tempsDeLecture(article.content);

  const candidats = [...memeTheme.items, ...recents.items];
  const more = candidats
    .filter(
      (item, index) =>
        item.id !== article.id && candidats.findIndex((autre) => autre.id === item.id) === index,
    )
    .slice(0, 3);

  const appel = APPELS[article.category];

  // Les liens de partage sont de simples adresses : aucun script, aucun
  // traceur tiers, et ils fonctionnent même si le visiteur refuse le
  // JavaScript.
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://1001sadaqa.com';
  const adresse = encodeURIComponent(`${site}/actualites/${article.slug}`);
  const titre = encodeURIComponent(article.title);

  const partages = [
    {
      cle: 'WhatsApp',
      href: `https://wa.me/?text=${titre}%20${adresse}`,
      Icon: MessageCircle,
    },
    {
      cle: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${adresse}`,
      Icon: Facebook,
    },
    {
      cle: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${adresse}`,
      Icon: Linkedin,
    },
  ];

  return (
    <>
      <article>
        <header className="bg-ink-gradient relative isolate overflow-hidden">
          <div className="grain absolute inset-0" aria-hidden />

          <div className="container-page relative py-14 md:py-20">
            {/* ── Fil d'Ariane ────────────────────────────────────────── */}
            <Reveal from="none">
              <nav aria-label={t('breadcrumb')}>
                <ol className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-paper/60">
                  <li>
                    <Link href="/" className="link-sweep link-tap">
                      {t('home')}
                    </Link>
                  </li>
                  <li aria-hidden>
                    <ChevronRight className="size-3.5" />
                  </li>
                  <li>
                    <Link href="/actualites" className="link-sweep link-tap">
                      {t('backLink')}
                    </Link>
                  </li>
                  <li aria-hidden>
                    <ChevronRight className="size-3.5" />
                  </li>
                  <li aria-current="page" className="text-paper/80">
                    {article.title}
                  </li>
                </ol>
              </nav>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="eyebrow mt-8 text-gold">{tCategories(article.category)}</p>
            </Reveal>

            <Reveal delay={0.14}>
              <h1 className="text-title mt-4 max-w-4xl text-paper">{article.title}</h1>
            </Reveal>

            <Reveal delay={0.22}>
              <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-paper/55">
                {article.publishedAt && (
                  <span>
                    {t('publishedOn')}{' '}
                    <time dateTime={article.publishedAt}>
                      {formatDate(article.publishedAt)}
                    </time>
                  </span>
                )}
                {article.author && <span>{`${t('by')} ${article.author.name}`}</span>}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden />
                  {minutes} {t('readingTime')}
                </span>
              </p>
            </Reveal>
          </div>
        </header>

        <div className="container-page py-14 md:py-20">
          <ParallaxMedia
            src={article.image ?? '/images/home/hero.jpg'}
            alt={article.title}
            className="aspect-16/9 rounded-card"
            sizes="100vw"
          />

          {/* Légende et crédit sous l'image, comme dans la presse : le crédit
              est un droit de l'auteur, pas une mention décorative. */}
          {(article.imageCaption || article.imageCredit) && (
            <p className="mx-auto mt-3 max-w-2xl text-[0.8125rem] leading-relaxed text-muted">
              {article.imageCaption}
              {article.imageCaption && article.imageCredit ? ' · ' : ''}
              {article.imageCredit && (
                <span className="italic">© {article.imageCredit}</span>
              )}
            </p>
          )}

          {/* Colonne de lecture volontairement étroite : environ 70 caractères
              par ligne, ce qui reste confortable. */}
          <div className="mx-auto mt-12 max-w-2xl">
            {article.excerpt && (
              <p className="font-display text-lg leading-relaxed font-medium text-ink">
                {article.excerpt}
              </p>
            )}

            <div className="mt-7 space-y-5">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="text-[1.0625rem] leading-relaxed text-ink/80">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* ── Partage ──────────────────────────────────────────────── */}
            <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-8">
              <span className="text-[0.8125rem] font-semibold text-ink">{t('share')}</span>
              {partages.map(({ cle, href, Icon }) => (
                <a
                  key={cle}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-[0.8125rem] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-mist"
                >
                  <Icon className="size-4" aria-hidden />
                  {cle}
                  <span className="sr-only"> - {t('shareOn')}</span>
                </a>
              ))}
            </div>

            {/* ── Appel à l'action, selon le thème ─────────────────────── */}
            <div className="mt-8 rounded-panel bg-ink p-6">
              <p className="font-display text-base font-bold tracking-tight text-paper">
                {t(`cta.${appel.cle}.title`)}
              </p>
              <p className="mt-2 text-[0.9375rem] text-paper/70">{t(`cta.${appel.cle}.body`)}</p>
              <ActionLink href={appel.href} size="sm" className="mt-5">
                {t(`cta.${appel.cle}.action`)}
              </ActionLink>
            </div>

            <p className="mt-10">
              <Link
                href="/actualites"
                className="link-sweep link-tap inline-flex items-center gap-2 text-sm font-medium text-muted"
              >
                <ArrowLeft className="size-4" aria-hidden />
                {t('backLink')}
              </Link>
            </p>
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="bg-mist py-16 md:py-24">
          <div className="container-page">
            <h2 className="font-display text-heading font-bold tracking-tight text-ink">
              {t('moreTitle')}
            </h2>

            <RevealGroup
              className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              stagger={0.09}
              as="ul"
            >
              {more.map((item) => (
                <RevealItem key={item.id} as="li">
                  <NewsCard article={item} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}
    </>
  );
}
