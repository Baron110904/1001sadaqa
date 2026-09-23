'use client';

import { useActionState } from 'react';
import { Check } from 'lucide-react';
import { updateSetting, type ActionResult } from '@/app/admin/actions';

/**
 * Une ligne de paramètre, avec son propre formulaire.
 *
 * Un formulaire par paramètre plutôt qu'un gros formulaire global : on ne
 * risque pas d'écraser une valeur qu'on n'a pas touchée, et le retour
 * d'enregistrement se lit à côté du champ concerné.
 *
 * Les valeurs secrètes ne sont jamais renvoyées par l'API. Le champ affiche
 * donc si une clé est enregistrée, sans la révéler : la saisir à nouveau la
 * remplace, la laisser vide ne l'efface pas.
 */
export function SettingRow({
  settingKey,
  label,
  kind,
  value,
  options,
  isSecret,
  isSet,
}: {
  settingKey: string;
  label: string;
  kind: 'text' | 'boolean' | 'number' | 'list' | 'select';
  value: unknown;
  /** Choix proposés quand le paramètre se sélectionne au lieu de se saisir. */
  options?: { value: string; label: string }[];
  isSecret: boolean;
  isSet: boolean;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    updateSetting,
    null,
  );

  const display =
    kind === 'list' && Array.isArray(value)
      ? value.join(', ')
      : value === null || value === undefined
        ? ''
        : String(value);

  const isLong = kind === 'text' && display.length > 60;

  return (
    <form action={action} className="flex flex-wrap items-start gap-x-4 gap-y-2">
      <input type="hidden" name="key" value={settingKey} />
      <input type="hidden" name="kind" value={kind} />

      <label
        htmlFor={`param-${settingKey}`}
        className="min-w-56 flex-1 pt-2.5 text-[0.9375rem] text-ink"
      >
        {label}
      </label>

      <div className="flex min-w-64 flex-1 flex-col gap-2">
        {kind === 'select' ? (
          <select
            id={`param-${settingKey}`}
            name="value"
            defaultValue={String(value ?? '')}
            className="w-full appearance-none rounded-card border border-ink/15 bg-paper px-3.5 py-2.5 text-[0.875rem] text-ink outline-none transition-all hover:border-ink/30 focus:border-gold focus:ring-4 focus:ring-gold/18"
          >
            {(options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : kind === 'boolean' ? (
          <label className="flex cursor-pointer items-center gap-2.5 py-2.5 text-[0.9375rem] text-ink">
            <input
              id={`param-${settingKey}`}
              name="value"
              type="checkbox"
              defaultChecked={value === true}
              className="size-4 accent-[#0B2E15]"
            />
            {value === true ? 'Activé' : 'Désactivé'}
          </label>
        ) : isLong ? (
          <textarea
            id={`param-${settingKey}`}
            name="value"
            defaultValue={display}
            rows={3}
            className="w-full rounded-card border border-ink/15 bg-paper px-3.5 py-2.5 text-[0.875rem] text-ink outline-none transition-all hover:border-ink/30 focus:border-gold focus:ring-4 focus:ring-gold/18"
          />
        ) : (
          <input
            id={`param-${settingKey}`}
            name="value"
            type={kind === 'number' ? 'number' : 'text'}
            defaultValue={isSecret ? '' : display}
            placeholder={
              isSecret
                ? isSet
                  ? '•••••• - saisir pour remplacer'
                  : ''
                : kind === 'list'
                  ? 'valeurs séparées par des virgules'
                  : undefined
            }
            className="w-full rounded-card border border-ink/15 bg-paper px-3.5 py-2.5 text-[0.875rem] text-ink outline-none transition-all placeholder:text-muted/70 hover:border-ink/30 focus:border-gold focus:ring-4 focus:ring-gold/18"
          />
        )}

        {state && (
          <p
            role={state.ok ? 'status' : 'alert'}
            className={`text-[0.8125rem] ${state.ok ? 'text-leaf' : 'text-red-700'}`}
          >
            {state.ok ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5" aria-hidden />
                {state.message}
              </span>
            ) : (
              state.message
            )}
          </p>
        )}
      </div>

      <div className="pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-ink/15 px-4 py-2 font-display text-[0.8125rem] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-mist disabled:opacity-55"
        >
          {pending ? '…' : 'Enregistrer'}
        </button>
      </div>

    </form>
  );
}
