import type { Metadata } from 'next';
import { Lien as Link } from '@/components/ui/Lien';
import { ArrowLeft } from 'lucide-react';
import { getFoodbank } from '@/lib/api';
import { FoodbankRequestForm } from '@/components/forms/FoodbankRequestForm';
import { poserLaLangueDe } from '@/lib/langue';
import { canoniquePour } from '@/lib/seo';
import { text } from '@/lib/text';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const langue = await poserLaLangueDe(params);
  const t = text('foodbank.ask');
  return { title: t('metaTitle'), description: t('metaDescription'), alternates: canoniquePour('/banque-alimentaire/demander', langue) };
}

/**
 * Demander une denrée.
 *
 * La banque ne sert pas qu'à recevoir. Le choix est limité à ce qu'elle gère
 * réellement : proposer un article absent de la réserve reviendrait à faire
 * espérer pour rien.
 */
export default async function DemanderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await poserLaLangueDe(params);
  const t = text('foodbank.ask');
  const tBanque = text('foodbank');
  const banque = await getFoodbank();

  // On ne propose que ce qu'il y a en réserve : une demande sur un article
  // épuisé serait refusée à la validation, après une attente inutile.
  const disponibles = banque.categories.filter((categorie) => categorie.quantity > 0);

  return (
    <section className="container-page py-14 md:py-20">
      <Link
        href="/banque-alimentaire"
        className="link-sweep link-tap inline-flex items-center gap-2 font-display text-[0.875rem] font-semibold text-ink"
      >
        <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden />
        {tBanque('backLink')}
      </Link>

      <h1 className="text-title mt-6 font-display font-bold text-ink">{t('title')}</h1>
      <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
        {t('lead')}
      </p>

      <div className="mt-10 max-w-2xl">
        {disponibles.length === 0 ? (
          <p className="rounded-panel border border-ink/10 bg-mist px-6 py-10 text-center text-[0.9375rem] leading-relaxed text-muted">
            {t('emptyBefore')}{' '}
            <Link href="/contact" className="link-sweep font-semibold text-ink">
              {t('emptyLink')}
            </Link>{' '}
            {t('emptyAfter')}
          </p>
        ) : (
          <FoodbankRequestForm kind="RETRAIT" categories={disponibles} />
        )}
      </div>
    </section>
  );
}
