'use client';

import { Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { removeResource } from '@/app/admin/actions';

/**
 * Suppression en deux temps.
 *
 * Le premier clic remplace le bouton par une demande de confirmation nommant
 * l'élément concerné. Une suppression est irréversible : elle ne doit pas
 * pouvoir arriver par un clic distrait sur la bonne ligne d'un tableau.
 *
 * La liste qui contient ce bouton est rendue dans le navigateur : au retour de
 * l'action, on la prévient plutôt que de recharger l'écran.
 */
export function DeleteButton({
  resourceSlug,
  id,
  label,
  onDeleted,
  onError,
}: {
  resourceSlug: string;
  id: string;
  label: string;
  onDeleted: () => void;
  onError: (message: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Supprimer ${label}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 font-display text-[0.8125rem] font-semibold text-muted transition-colors hover:border-red-600/40 hover:bg-red-50 hover:text-red-800"
      >
        <Trash2 className="size-3.5" aria-hidden />
        Supprimer
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[0.8125rem] text-muted">Confirmer ?</span>

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await removeResource(resourceSlug, id);
            if (result.ok) onDeleted();
            else {
              setConfirming(false);
              onError(result.message ?? 'La suppression a échoué.');
            }
          })
        }
        className="rounded-full bg-red-700 px-3 py-1.5 font-display text-[0.8125rem] font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
      >
        {pending ? 'Suppression…' : 'Oui, supprimer'}
      </button>

      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="rounded-full border border-ink/15 px-3 py-1.5 font-display text-[0.8125rem] font-semibold text-ink transition-colors hover:bg-mist"
      >
        Non
      </button>
    </span>
  );
}
