'use client';

import { useActionState } from 'react';
import { BadgeCheck, Clock, Trash2 } from 'lucide-react';
import { addImpact, deleteImpact, type ActionResult } from '@/app/admin/actions';
import { TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';
import { Badge, Panel } from './ui';
import { formatDate } from '@/lib/format';

export interface Impact {
  id: string;
  indicator: string;
  value: string;
  period: string;
  verified: boolean;
  isPrimary: boolean;
}

/**
 * Données d'impact d'un projet.
 *
 * Deux règles portées par cet écran :
 *  - un seul indicateur mis en avant par projet, celui affiché sur la carte ;
 *    l'API bascule automatiquement les autres.
 *  - la mention « vérifié » n'est pas décorative. Un chiffre non vérifié
 *    s'affiche comme tel sur le site public : c'est ce qui rend les données
 *    d'impact opposables à un bailleur.
 */
export function ImpactPanel({
  projectId,
  impacts,
  canEdit,
}: {
  projectId: string;
  impacts: Impact[];
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    addImpact,
    null,
  );

  return (
    <Panel className="mt-6">
      <h2 className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
        Données d’impact
      </h2>

      {impacts.length > 0 ? (
        <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
          {impacts.map((impact) => (
            <li key={impact.id} className="flex flex-wrap items-center gap-3 py-3.5">
              <span className="flex items-baseline gap-2">
                <span className="font-display text-xl font-bold tracking-tight text-ink tabular">
                  {impact.value}
                </span>
                <span className="text-[0.875rem] text-muted">{impact.indicator}</span>
              </span>

              <span className="flex flex-1 flex-wrap items-center gap-2">
                {impact.isPrimary && <Badge tone="wait">Mis en avant</Badge>}
                {impact.verified ? (
                  <Badge tone="ok">
                    <BadgeCheck className="mr-1 size-3" aria-hidden />
                    Vérifié
                  </Badge>
                ) : (
                  <Badge tone="off">
                    <Clock className="mr-1 size-3" aria-hidden />
                    Non vérifié
                  </Badge>
                )}
                <span className="text-[0.8125rem] text-muted">
                  {formatDate(impact.period)}
                </span>
              </span>

              {canEdit && (
                <form action={deleteImpact}>
                  <input type="hidden" name="impactId" value={impact.id} />
                  <button
                    type="submit"
                    aria-label={`Supprimer l’indicateur ${impact.indicator}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 font-display text-[0.8125rem] font-semibold text-muted transition-colors hover:border-red-600/40 hover:bg-red-50 hover:text-red-800"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Retirer
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-card border border-dashed border-ink/20 bg-mist px-4 py-6 text-center text-[0.875rem] text-muted">
          Aucun indicateur enregistré.
        </p>
      )}

      {canEdit && (
        <form action={action} className="mt-6 border-t border-ink/10 pt-6">
          <input type="hidden" name="projectId" value={projectId} />

          <FormStatus
            state={state ? (state.ok ? 'success' : 'error') : 'idle'}
            message={state?.message}
          />

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <TextField
              id="impact-value"
              name="value"
              label="Valeur"
              hideLabel={false}
              placeholder="400"
              required
            />
            <TextField
              id="impact-indicator"
              name="indicator"
              label="Indicateur"
              hideLabel={false}
              placeholder="familles servies"
              required
            />
            <TextField
              id="impact-period"
              name="period"
              type="date"
              label="Période"
              hideLabel={false}
              required
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-5">
            <label className="flex cursor-pointer items-center gap-2.5 text-[0.875rem] text-ink">
              <input
                type="checkbox"
                name="verified"
                className="size-4 accent-[#0B2E15]"
              />
              Chiffre vérifié
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 text-[0.875rem] text-ink">
              <input
                type="checkbox"
                name="isPrimary"
                className="size-4 accent-[#0B2E15]"
              />
              Mettre en avant sur la carte du projet
            </label>
          </div>

          <ActionButton type="submit" variant="dark" size="sm" disabled={pending} className="mt-5">
            {pending ? 'Ajout…' : 'Ajouter l’indicateur'}
          </ActionButton>
        </form>
      )}
    </Panel>
  );
}
