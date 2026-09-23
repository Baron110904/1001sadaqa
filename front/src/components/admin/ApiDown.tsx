'use client';

import { RotateCcw, TriangleAlert } from 'lucide-react';

/**
 * Panneau de panne du back-office.
 *
 * Il existe pour une raison précise : une erreur de lecture ne doit pas se
 * traduire par une déconnexion. Auparavant, toute API injoignable était prise
 * pour une session expirée — l'équipe se retrouvait au formulaire, cookies
 * purgés, saisie perdue. Désormais la session reste ouverte et il suffit de
 * réessayer.
 *
 * Le détail technique n'est pas montré : il n'aide pas la personne devant
 * l'écran, et un message brut peut révéler la structure interne.
 */
export function ApiDown({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-panel border border-gold/40 bg-gold/8 p-6 md:p-8">
        <div className="flex items-start gap-3.5">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-gold-deep" aria-hidden />

          <div>
            <h1 className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
              Cet écran n’a pas pu être chargé
            </h1>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
              Votre session reste ouverte. Il s’agit le plus souvent d’une
              interruption passagère : réessayez, et prévenez la personne qui
              administre le serveur si cela se répète.
            </p>

            <button
              type="button"
              onClick={onRetry ?? (() => window.location.reload())}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-display text-[0.875rem] font-semibold text-paper transition-colors hover:bg-ink-deep"
            >
              <RotateCcw className="size-4" strokeWidth={2.5} aria-hidden />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
