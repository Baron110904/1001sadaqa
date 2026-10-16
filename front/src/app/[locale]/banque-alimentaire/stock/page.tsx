import type { Metadata } from 'next';
import { Lien as Link } from '@/components/ui/Lien';
import { ArrowLeft, PackagePlus } from 'lucide-react';
import { getFoodbank } from '@/lib/api';
import { FeuilleDeStock } from '@/components/foodbank/FeuilleDeStock';
import { poserLaLangueDe } from '@/lib/langue';
import { canoniquePour } from '@/lib/seo';
import { text } from '@/lib/text';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const langue = await poserLaLangueDe(params);
  const t = text('foodbank.stock');
  return { title: t('metaTitle'), description: t('metaDescription'), alternates: canoniquePour('/banque-alimentaire/stock', langue) };
}

/**
 * L'inventaire, sur sa propre page.
 *
 * Il vivait dans la page d'accueil de la banque, sous forme de vignettes. Un
 * inventaire se consulte : on y cherche un article, on trie par ce qui manque.
 * Ces gestes appellent un tableau et une adresse à soi, pas une section au
 * milieu d'une page de présentation.
 */
export default async function StockPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await poserLaLangueDe(params);
  const t = text('foodbank.stock');
  const tBanque = text('foodbank');
  const banque = await getFoodbank();

  return (
    <>
      <section className="bg-mist pt-12 pb-10 md:pt-16">
        <div className="container-page">
          <Link
            href="/banque-alimentaire"
            className="link-tap inline-flex items-center gap-2 text-[0.875rem] font-semibold text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {tBanque('backLink')}
          </Link>

          <h1 className="mt-5 font-display text-heading font-bold tracking-tight text-ink">
            {t('title')}
          </h1>

          <p className="mt-4 max-w-2xl text-[1rem] leading-relaxed text-muted">
            {t('lead')}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/banque-alimentaire/apporter"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-display text-[0.875rem] font-semibold text-paper transition-colors hover:bg-ink/90"
            >
              <PackagePlus className="size-4" aria-hidden />
              {t('giveCta')}
            </Link>
            <Link
              href="/banque-alimentaire/registre"
              className="inline-flex items-center rounded-full border border-ink/20 px-5 py-3 font-display text-[0.875rem] font-semibold text-ink transition-colors hover:border-ink/45 hover:bg-paper"
            >
              {t('registerCta')}
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-12 md:py-16">
        <FeuilleDeStock categories={banque.categories} />
      </section>
    </>
  );
}
