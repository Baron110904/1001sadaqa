'use client';

import { publierMotBanque, supprimerMotBanque } from '@/app/admin/actions';

/**
 * Publier, retirer, supprimer un mot reçu.
 *
 * La suppression demande confirmation : c'est le mot de quelqu'un, et il n'y a
 * pas de corbeille derrière.
 */
export function MotActions({ id, isPublished }: { id: string; isPublished: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <form action={publierMotBanque}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="publier" value={isPublished ? 'non' : 'oui'} />
        <button
          type="submit"
          className="rounded-full border border-ink/15 px-3.5 py-2 font-display text-[0.8125rem] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-mist"
        >
          {isPublished ? 'Retirer du site' : 'Publier'}
        </button>
      </form>

      <form
        action={supprimerMotBanque}
        onSubmit={(evenement) => {
          if (!confirm('Supprimer ce mot ? Cette action est définitive.')) {
            evenement.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="rounded-full border border-red-600/25 px-3.5 py-2 font-display text-[0.8125rem] font-semibold text-red-700 transition-colors hover:border-red-600/60 hover:bg-red-50"
        >
          Supprimer
        </button>
      </form>
    </div>
  );
}
