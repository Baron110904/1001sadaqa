import { text } from '@/lib/text';
import Link from 'next/link';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { formatDate } from '@/lib/format';
import type { NewsArticle } from '@/lib/types';

export async function NewsCard({ article }: { article: NewsArticle }) {
  const t = text('news.categories');

  return (
    <Link
      href={`/actualites/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-ink/10 bg-paper transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-gold/45 hover:shadow-lift"
    >
      <MediaFrame
        src={article.image}
        alt={article.title}
        placeholder={t(article.category)}
        rounded="rounded-none"
        zoomOnHover
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="aspect-16/10 w-full"
      />

      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow text-leaf">{t(article.category)}</p>

        <h3 className="mt-2.5 flex-1 font-display text-[1.0625rem] leading-snug font-bold tracking-tight text-ink">
          {article.title}
        </h3>

        {article.publishedAt && (
          <time dateTime={article.publishedAt} className="mt-4 text-[0.8125rem] text-muted">
            {formatDate(article.publishedAt)}
          </time>
        )}
      </div>
    </Link>
  );
}
