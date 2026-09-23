import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getFoodbankDonors } from '@/lib/api';
import { FilterBar } from '@/components/ui/FilterBar';
import { formatNumber, formatXof } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Nos donateurs',
  description:
    'Celles et ceux qui approvisionnent la banque alimentaire de 1001 SADAQA, en denrées comme en dons financiers.',
};

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
  searchParams,
}: {
  searchParams: Promise<{ produit?: string; type?: string }>;
}) {
  const filtres = await searchParams;
  const { articles, critere, donateurs } = await getFoodbankDonors(filtres);

  const LEGENDE = {
    dons: 'Classé par nombre de dons. Choisissez un article pour classer par quantité.',
    quantite: 'Classé par quantité apportée de cet article.',
    montant: 'Classé par montant total donné.',
  }[critere];

  return (
    <section className="container-page py-14 md:py-20">
      <Link
        href="/banque-alimentaire"
        className="link-sweep link-tap inline-flex items-center gap-2 font-display text-[0.875rem] font-semibold text-ink"
      >
        <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden />
        Banque alimentaire
      </Link>

      <h1 className="text-title mt-6 font-display font-bold text-ink">Nos donateurs</h1>
      <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
        Celles et ceux qui remplissent la réserve, en denrées comme en argent. Les personnes ayant
        demandé l’anonymat n’y figurent pas : leur geste compte autant, il reste discret.
      </p>

      <div className="mt-8">
        <FilterBar
          action="/banque-alimentaire/donateurs"
          filtres={[
            {
              nom: 'type',
              label: 'Nature du don',
              tous: 'Tous les dons',
              valeur: filtres.type ?? '',
              options: [
                { value: 'nature', label: 'En denrées' },
                { value: 'financier', label: 'En argent' },
              ],
            },
            {
              nom: 'produit',
              label: 'Article',
              tous: 'Tous les articles',
              valeur: filtres.produit ?? '',
              options: articles.map((article) => ({ value: article.slug, label: article.name })),
            },
          ]}
        />
      </div>

      <p className="mt-4 text-[0.8125rem] text-muted">{LEGENDE}</p>

      {donateurs.length === 0 ? (
        <p className="mt-10 rounded-panel border border-ink/10 bg-mist px-6 py-10 text-center text-[0.9375rem] text-muted">
          Aucun donateur ne correspond à ce filtre pour le moment.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-panel border border-ink/10">
          <table className="w-full min-w-[40rem] border-collapse text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-ink/10 bg-mist">
                {['', 'Donateur', 'Dons', 'Denrées', 'En argent'].map((titre, rang) => (
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
        Vous aussi&nbsp;?{' '}
        <Link
          href="/banque-alimentaire/apporter"
          className="link-sweep link-tap font-semibold text-ink"
        >
          Apporter une denrée
        </Link>{' '}
        ou{' '}
        <Link href="/communaute/donateur" className="link-sweep link-tap font-semibold text-ink">
          faire un don financier
        </Link>
        .
      </p>
    </section>
  );
}
