import type { Metadata } from 'next';
import { Lien as Link } from '@/components/ui/Lien';
import { ArrowLeft } from 'lucide-react';
import { getFoodbankDonors } from '@/lib/api';
import { FilterBar } from '@/components/ui/FilterBar';
import { formatNumber, formatXof } from '@/lib/format';
import { poserLaLangueDe } from '@/lib/langue';
import { canoniquePour } from '@/lib/seo';
import { text } from '@/lib/text';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const langue = await poserLaLangueDe(params);
  const t = text('foodbank.donors');
  return { title: t('metaTitle'), description: t('metaDescription'), alternates: canoniquePour('/banque-alimentaire/donateurs', langue) };
}

/**
 * Le classement des donateurs.
 *
 * Sur quoi classer ? Les quantités ne se comparent pas d'un article à l'autre :
 * 40 litres d'huile ne valent pas 40 kg de riz, et les additionner produirait
 * un nombre dénué de sens. Le classement porte donc sur le **nombre de dons**,
 * sauf quand un article est choisi — là, toutes les quantités partagent la
 * même unité. Les dons financiers se classent par montant.
 *
 * Les dons anonymes ne figurent pas ici, et ne sortent même pas du serveur.
 */
export default async function DonateursPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ produit?: string; type?: string }>;
}) {
  await poserLaLangueDe(params);
  const t = text('foodbank.donors');
  const tBanque = text('foodbank');
  const filtres = await searchParams;
  const { articles, critere, donateurs } = await getFoodbankDonors(filtres);

  const LEGENDE = {
    dons: t('sortedByCount'),
    quantite: t('sortedByQuantity'),
    montant: t('sortedByAmount'),
  }[critere];

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

      <div className="mt-8">
        <FilterBar
          action="/banque-alimentaire/donateurs"
          filtres={[
            {
              nom: 'type',
              label: t('filterKind'),
              tous: t('filterKindAll'),
              valeur: filtres.type ?? '',
              options: [
                { value: 'nature', label: t('filterKindGoods') },
                { value: 'financier', label: t('filterKindMoney') },
              ],
            },
            {
              nom: 'produit',
              label: t('filterItem'),
              tous: t('filterItemAll'),
              valeur: filtres.produit ?? '',
              options: articles.map((article) => ({ value: article.slug, label: article.name })),
            },
          ]}
        />
      </div>

      <p className="mt-4 text-[0.8125rem] text-muted">{LEGENDE}</p>

      {donateurs.length === 0 ? (
        <p className="mt-10 rounded-panel border border-ink/10 bg-mist px-6 py-10 text-center text-[0.9375rem] text-muted">
          {t('empty')}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-panel border border-ink/10">
          <table className="w-full min-w-[40rem] border-collapse text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-ink/10 bg-mist">
                {['', t('colDonor'), t('colGifts'), t('colGoods'), t('colMoney')].map((titre, rang) => (
                  <th
                    key={titre || rang}
                    scope="col"
                    className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink"
                  >
                    {titre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donateurs.map((donateur) => (
                <tr key={`${donateur.rang}-${donateur.nom}`} className="border-b border-ink/8 last:border-0">
                  <td className="px-4 py-3">
                    <span
                      className={`flex size-8 items-center justify-center rounded-full font-display text-[0.8125rem] font-bold tabular ${
                        donateur.rang <= 3 ? 'bg-gold text-ink' : 'bg-fog text-muted'
                      }`}
                    >
                      {donateur.rang}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-display font-semibold text-ink">{donateur.nom}</td>
                  <td className="px-4 py-3 tabular text-ink">{donateur.dons}</td>
                  <td className="px-4 py-3 text-muted">
                    {donateur.quantite > 0 ? (
                      <>
                        <span className="font-semibold text-ink tabular">
                          {formatNumber(donateur.quantite)} {donateur.unite}
                        </span>
                        {donateur.articles.length > 0 && (
                          <span className="mt-0.5 block text-[0.75rem]">
                            {donateur.articles.join(', ')}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted/70">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {donateur.montant > 0 ? (
                      <span className="font-semibold text-ink tabular">
                        {formatXof(donateur.montant)}
                      </span>
                    ) : (
                      <span className="text-muted/70">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* `link-tap` donne à ces liens en ligne les 24 px de hauteur exigés au
          doigt : sans lui, ils ne faisaient que 18 px. */}
      <p className="mt-8 text-[0.875rem] text-muted">
        {t('youToo')}{' '}
        <Link
          href="/banque-alimentaire/apporter"
          className="link-sweep link-tap font-semibold text-ink"
        >
          {t('bringCta')}
        </Link>{' '}
        {t('orWord')}{' '}
        <Link href="/communaute/donateur" className="link-sweep link-tap font-semibold text-ink">
          {t('giveCta')}
        </Link>
        .
      </p>
    </section>
  );
}
