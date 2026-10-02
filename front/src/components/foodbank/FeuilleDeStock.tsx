'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Search, X } from 'lucide-react';
import type { FoodCategoryState } from '@/lib/types';
import { formatNumber } from '@/lib/format';

/**
 * L'inventaire, présenté comme une feuille de calcul.
 *
 * Recherche et filtres agissent dans le navigateur, sans aller-retour au
 * serveur : l'inventaire tient en quelques dizaines de lignes, et une liste
 * qui se réduit à la frappe se lit bien mieux qu'une page qui se recharge.
 *
 * Aucun total toutes catégories confondues n'est affiché : additionner des
 * kilos, des litres et des unités donnerait un nombre qui ne veut rien dire.
 * On compte ce qui se compte — les articles, et ceux qui demandent attention.
 */

const NIVEAUX = {
  CRITIQUE: { texte: 'Critique', pastille: 'bg-red-100 text-red-800', barre: 'bg-red-500' },
  BAS: { texte: 'Bas', pastille: 'bg-gold/25 text-gold-deep', barre: 'bg-gold' },
  OK: { texte: 'Suffisant', pastille: 'bg-leaf/15 text-leaf', barre: 'bg-leaf' },
} as const;

type Colonne = 'name' | 'quantity' | 'level' | 'part';

/** Part du niveau visé, bornée à 100 : au-delà, la barre déborderait. */
const part = (c: FoodCategoryState): number =>
  c.target > 0 ? Math.min(100, Math.round((c.quantity / c.target) * 100)) : 0;

/** Pour que « cereales » trouve « Riz & céréales ». */
const aplatir = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Ordre d'urgence, et non alphabétique : c'est ce qui manque qui compte. */
const URGENCE = { CRITIQUE: 0, BAS: 1, OK: 2 } as const;

export function FeuilleDeStock({ categories }: { categories: FoodCategoryState[] }) {
  const [recherche, setRecherche] = useState('');
  const [niveau, setNiveau] = useState<'TOUS' | keyof typeof NIVEAUX>('TOUS');
  const [colonne, setColonne] = useState<Colonne>('level');
  const [descendant, setDescendant] = useState(false);

  const lignes = useMemo(() => {
    const cherche = aplatir(recherche.trim());

    const filtrees = categories.filter((c) => {
      if (niveau !== 'TOUS' && c.level !== niveau) return false;
      if (!cherche) return true;
      // On cherche aussi dans les exemples : quelqu'un qui tape « spaghetti »
      // doit tomber sur la catégorie « Pâtes », où le mot ne figure pas.
      return aplatir(`${c.name} ${c.examples ?? ''} ${c.unit}`).includes(cherche);
    });

    const sens = descendant ? -1 : 1;
    return [...filtrees].sort((a, b) => {
      if (colonne === 'name') return sens * a.name.localeCompare(b.name, 'fr');
      if (colonne === 'quantity') return sens * (a.quantity - b.quantity);
      if (colonne === 'part') return sens * (part(a) - part(b));
      return sens * (URGENCE[a.level] - URGENCE[b.level] || a.name.localeCompare(b.name, 'fr'));
    });
  }, [categories, recherche, niveau, colonne, descendant]);

  const trier = (cible: Colonne) => {
    if (cible === colonne) setDescendant((avant) => !avant);
    else {
      setColonne(cible);
      setDescendant(false);
    }
  };

  const EnTete = ({ cible, children, aDroite = false }: {
    cible: Colonne;
    children: React.ReactNode;
    aDroite?: boolean;
  }) => (
    <th scope="col" className={`px-4 py-3 ${aDroite ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={() => trier(cible)}
        aria-sort={colonne === cible ? (descendant ? 'descending' : 'ascending') : 'none'}
        className={`inline-flex items-center gap-1.5 font-display text-[0.8125rem] font-bold tracking-tight transition-colors hover:text-ink ${
          colonne === cible ? 'text-ink' : 'text-muted'
        }`}
      >
        {children}
        {colonne === cible &&
          (descendant ? (
            <ArrowDown className="size-3.5" aria-hidden />
          ) : (
            <ArrowUp className="size-3.5" aria-hidden />
          ))}
      </button>
    </th>
  );

  return (
    <div>
      {/* ── Recherche et filtres ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[13rem] flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <label className="sr-only" htmlFor="stock-recherche">
            Rechercher un article
          </label>
          <input
            id="stock-recherche"
            type="search"
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher un article — riz, huile, savon…"
            className="w-full rounded-card border border-ink/15 bg-paper py-3 pr-10 pl-11 text-[0.9375rem] text-ink outline-none transition-all placeholder:text-muted/70 hover:border-ink/30 focus:border-gold focus:ring-4 focus:ring-gold/18"
          />
          {recherche && (
            <button
              type="button"
              onClick={() => setRecherche('')}
              aria-label="Effacer la recherche"
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-mist hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par niveau">
          {(['TOUS', 'CRITIQUE', 'BAS', 'OK'] as const).map((valeur) => {
            const actif = niveau === valeur;
            const nombre =
              valeur === 'TOUS'
                ? categories.length
                : categories.filter((c) => c.level === valeur).length;

            return (
              <button
                key={valeur}
                type="button"
                onClick={() => setNiveau(valeur)}
                aria-pressed={actif}
                className={`rounded-full border px-4 py-2.5 font-display text-[0.8125rem] font-semibold transition-all duration-300 ${
                  actif
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/15 text-ink hover:border-ink/40 hover:bg-mist'
                }`}
              >
                {valeur === 'TOUS' ? 'Tous' : NIVEAUX[valeur].texte}
                <span className={`ml-1.5 tabular ${actif ? 'text-paper/60' : 'text-muted'}`}>
                  {nombre}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-[0.875rem] text-muted" aria-live="polite">
        {lignes.length === categories.length
          ? `${categories.length} articles suivis`
          : `${lignes.length} article${lignes.length > 1 ? 's' : ''} sur ${categories.length}`}
      </p>

      {/* ── La feuille ──
          Le tableau défile dans son propre cadre : c'est la seule façon de
          garder six colonnes lisibles sur un téléphone sans que la page
          entière ne parte de côté. */}
      <div className="mt-4 overflow-x-auto rounded-panel border border-ink/12">
        <table className="w-full min-w-[46rem] border-collapse text-[0.875rem]">
          <caption className="sr-only">
            État du stock de la banque alimentaire, par article
          </caption>
          <thead className="border-b border-ink/12 bg-mist">
            <tr>
              <EnTete cible="name">Article</EnTete>
              <EnTete cible="quantity" aDroite>
                En stock
              </EnTete>
              <th scope="col" className="px-4 py-3 text-right font-display text-[0.8125rem] font-bold text-muted">
                Niveau visé
              </th>
              <EnTete cible="part" aDroite>
                Couverture
              </EnTete>
              <EnTete cible="level">État</EnTete>
              <th scope="col" className="px-4 py-3 text-left font-display text-[0.8125rem] font-bold text-muted">
                Denrées attendues
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-ink/8">
            {lignes.map((categorie) => {
              const etat = NIVEAUX[categorie.level];
              const couverture = part(categorie);

              return (
                <tr key={categorie.id} className="bg-paper transition-colors hover:bg-mist/60">
                  <th scope="row" className="px-4 py-3.5 text-left font-medium text-ink">
                    {categorie.name}
                  </th>
                  <td className="px-4 py-3.5 text-right font-display font-bold text-ink tabular whitespace-nowrap">
                    {formatNumber(categorie.quantity)}{' '}
                    <span className="text-[0.8125rem] font-semibold text-muted">
                      {categorie.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-muted tabular whitespace-nowrap">
                    {categorie.target > 0 ? `${formatNumber(categorie.target)} ${categorie.unit}` : '-'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center justify-end gap-2.5">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-ink/8">
                        <span
                          className={`block h-full rounded-full ${etat.barre}`}
                          style={{ width: `${couverture}%` }}
                        />
                      </span>
                      <span className="w-10 text-right text-muted tabular">{couverture}%</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 font-display text-[0.75rem] font-semibold ${etat.pastille}`}
                    >
                      {etat.texte}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted">{categorie.examples ?? '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {lignes.length === 0 && (
          <p className="px-4 py-10 text-center text-[0.9375rem] text-muted">
            Aucun article ne correspond à cette recherche.
          </p>
        )}
      </div>
    </div>
  );
}
