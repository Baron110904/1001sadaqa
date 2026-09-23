'use client';

import { useRef } from 'react';
import { updateRequestStatus } from '@/app/admin/actions';

/**
 * Changement de statut d'une demande.
 *
 * Le formulaire s'envoie dès la sélection : c'est le geste quotidien de cet
 * écran, il ne mérite pas un bouton supplémentaire. Un bouton de secours reste
 * présent pour la navigation sans JavaScript.
 */
export function StatusSelect({
  path,
  tag,
  current,
  options,
  retour,
}: {
  path: string;
  tag: string;
  current: string;
  options: { value: string; label: string }[];
  /** Adresse où revenir pour montrer un refus de l'API, le cas échéant. */
  retour?: string;
}) {
  const form = useRef<HTMLFormElement>(null);

  return (
    <form ref={form} action={updateRequestStatus} className="flex items-center gap-1.5">
      <input type="hidden" name="__path" value={path} />
      <input type="hidden" name="__tag" value={tag} />
      {retour && <input type="hidden" name="__retour" value={retour} />}

      <label className="sr-only" htmlFor={`statut-${path}`}>
        Changer le statut
      </label>
      <select
        id={`statut-${path}`}
        name="status"
        defaultValue={current}
        onChange={() => form.current?.requestSubmit()}
        className="rounded-full border border-ink/15 bg-paper px-3 py-1.5 font-display text-[0.8125rem] font-semibold text-ink outline-none transition-colors hover:border-ink/40 focus:border-gold focus:ring-2 focus:ring-gold/25"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <noscript>
        <button
          type="submit"
          className="rounded-full border border-ink/15 px-3 py-1.5 font-display text-[0.8125rem] font-semibold text-ink"
        >
          Valider
        </button>
      </noscript>
    </form>
  );
}
