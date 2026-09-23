'use client';

import { Search } from 'lucide-react';

/**
 * Barre de filtres : une recherche, puis des listes déroulantes.
 *
 * Tout passe par un formulaire en GET. Trois conséquences voulues : l'état des
 * filtres vit dans l'adresse, donc un résultat se partage ; la page reste
 * utilisable sans JavaScript ; et les moteurs de recherche voient des URL
 * stables plutôt qu'un état caché dans le navigateur.
 *
 * Le changement d'une liste envoie le formulaire aussitôt - c'est le geste
 * attendu. Le bouton « Rechercher » reste présent pour la saisie au clavier et
 * pour le cas sans JavaScript, où il devient le seul moyen de valider.
 */

export interface FiltreDeroulant {
  /** Nom du paramètre d'URL. */
  nom: string;
  label: string;
  /** Libellé de l'option neutre, qui retire le filtre. */
  tous: string;
  valeur?: string;
  options: { value: string; label: string }[];
}

export function FilterBar({
  action,
  recherche,
  placeholder,
  labelRecherche,
  actionRecherche,
  filtres,
}: {
  action: string;
  /** Valeur courante du champ de recherche. Omis : pas de recherche. */
  recherche?: string;
  placeholder?: string;
  labelRecherche?: string;
  actionRecherche?: string;
  filtres: FiltreDeroulant[];
}) {
  const envoyer = (evenement: { currentTarget: HTMLSelectElement }) =>
    evenement.currentTarget.form?.requestSubmit();

  /**
   * Retire de l'envoi les champs restés vides.
   *
   * Un formulaire en GET transmet tout, y compris les listes laissées sur
   * « Tous » : l'adresse se remplissait de « &programme= » inutiles. Un champ
   * désactivé n'est pas transmis - on les neutralise juste avant l'envoi,
   * puis on les réactive pour que la page reste utilisable après un retour.
   */
  const nettoyer = (evenement: React.FormEvent<HTMLFormElement>) => {
    const champs = Array.from(evenement.currentTarget.elements).filter(
      (element): element is HTMLInputElement | HTMLSelectElement =>
        (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) &&
        Boolean(element.name) &&
        element.value === '',
    );

    for (const champ of champs) champ.disabled = true;
    window.setTimeout(() => {
      for (const champ of champs) champ.disabled = false;
    }, 0);
  };

  return (
    <form
      action={action}
      method="get"
      role="search"
      onSubmit={nettoyer}
      className="container-page flex flex-col gap-4 lg:flex-row lg:items-end"
    >
      {placeholder !== undefined && (
        <div className="flex flex-1 gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{labelRecherche}</span>
            <span className="relative block">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                name="q"
                defaultValue={recherche ?? ''}
                placeholder={placeholder}
                className="w-full rounded-full border border-ink/15 bg-paper py-3 pr-5 pl-11 text-[0.9375rem] text-ink placeholder:text-muted focus:border-ink/40 focus:outline-none"
              />
            </span>
          </label>

          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-5 py-3 font-display text-[0.8125rem] font-semibold text-paper transition-colors hover:bg-ink-deep"
          >
            <Search className="size-4" strokeWidth={2.5} aria-hidden />
            {actionRecherche}
          </button>
        </div>
      )}

      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtres.map((filtre) => (
          <label key={filtre.nom} className="block">
            <span className="mb-1.5 block text-[0.6875rem] font-bold tracking-[0.12em] text-muted uppercase">
              {filtre.label}
            </span>
            <select
              name={filtre.nom}
              defaultValue={filtre.valeur ?? ''}
              onChange={envoyer}
              className="w-full rounded-card border border-ink/15 bg-paper px-4 py-3 font-display text-[0.9375rem] font-semibold text-ink focus:border-ink/40 focus:outline-none"
            >
              <option value="">{filtre.tous}</option>
              {filtre.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </form>
  );
}
