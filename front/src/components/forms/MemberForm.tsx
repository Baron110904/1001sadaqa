'use client';

import { useActionState, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { sendMembership } from '@/app/actions';
import type { SubmitResult } from '@/lib/api';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';
import { formatXof } from '@/lib/format';

/** Plancher de cotisation mensuelle, en francs CFA (§7.4.2). */
const MINIMUM = 1000;

/** Paliers suggérés. Le champ libre reste la référence. */
const PALIERS = [1000, 2000, 5000, 10000] as const;

const DOMAINES = [
  'Protection sociale',
  'Sécurité et aide alimentaires',
  'Santé communautaire & WASH',
  'Autonomisation économique',
] as const;

const PARTICIPATIONS = [
  'Vie associative',
  'Terrain',
  'Mobilisation de partenaires',
  'Appui technique',
] as const;

/**
 * Formulaire d'adhésion.
 *
 * Le montant est un **plancher, pas un plafond** : les paliers ne sont que des
 * suggestions, et le champ libre accepte tout montant à partir de mille francs.
 * Aucun prélèvement n'est mis en place — le membre revient payer comme il
 * ferait un don, et le site lui envoie un rappel à l'échéance.
 */
export function MemberForm() {
  const [state, action, pending] = useActionState<SubmitResult | null, FormData>(sendMembership, null);
  const [amount, setAmount] = useState<number>(MINIMUM);
  const [custom, setCustom] = useState('');

  const final = custom ? Number(custom) : amount;
  const tooLow = !final || final < MINIMUM;

  if (state?.ok) {
    return (
      <div className="rounded-panel border border-leaf/25 bg-mist p-7 md:p-9">
        <span className="flex size-12 items-center justify-center rounded-full bg-leaf/12 text-leaf">
          <CircleCheck className="size-6" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-heading font-bold tracking-tight text-ink">
          Votre demande d’adhésion est enregistrée
        </h2>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          Elle est examinée par l’équipe. Vous recevrez notre réponse par courriel, quelle qu’elle
          soit. Si elle est acceptée, vous recevrez aussi vos identifiants et le premier lien de
          paiement de cotisation.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-8">
      <FormStatus state={state && !state.ok ? 'error' : 'idle'} message={state?.message} />

      <div className="grid gap-5 md:grid-cols-2">
        <TextField id="member-name" name="name" label="Nom et prénom" required />
        <TextField id="member-email" name="email" type="email" label="Courriel" required />
        <TextField id="member-phone" name="phone" type="tel" label="Téléphone" required />
        <TextField id="member-city" name="city" label="Ville" required />
        <TextField id="member-country" name="country" label="Pays" defaultValue="Bénin" />
        <TextField id="member-profession" name="profession" label="Profession" />
      </div>

      <fieldset>
        <legend className="font-display text-[0.9375rem] font-semibold text-ink">
          Domaines qui vous intéressent
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {DOMAINES.map((domaine) => (
            <label
              key={domaine}
              className="flex cursor-pointer items-center gap-3 rounded-card border border-ink/12 px-4 py-3 text-[0.9375rem] text-ink transition-colors hover:border-ink/30"
            >
              <input
                type="checkbox"
                name="interests"
                value={domaine}
                className="size-6 shrink-0 accent-[#0B2E15]"
              />
              {domaine}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-[0.9375rem] font-semibold text-ink">
          Comment souhaitez-vous participer
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PARTICIPATIONS.map((mode) => (
            <label
              key={mode}
              className="flex cursor-pointer items-center gap-3 rounded-card border border-ink/12 px-4 py-3 text-[0.9375rem] text-ink transition-colors hover:border-ink/30"
            >
              <input
                type="checkbox"
                name="participation"
                value={mode}
                className="size-6 shrink-0 accent-[#0B2E15]"
              />
              {mode}
            </label>
          ))}
        </div>
      </fieldset>

      <TextAreaField
        id="member-motivation"
        name="motivation"
        label="Pourquoi rejoindre l’association"
        hideLabel={false}
        rows={4}
      />

      {/* ── Cotisation ── */}
      <fieldset>
        <legend className="font-display text-[0.9375rem] font-semibold text-ink">
          Votre cotisation mensuelle
        </legend>
        <p className="mt-2 text-[0.875rem] text-muted">
          À partir de {formatXof(MINIMUM)} par mois. Vous choisissez librement votre montant, et il
          n’engage pas les mois suivants.
        </p>

        <input type="hidden" name="pledgedAmount" value={tooLow ? '' : String(final)} />

        <div className="mt-4 flex flex-wrap gap-2">
          {PALIERS.map((palier) => (
            <button
              key={palier}
              type="button"
              onClick={() => {
                setAmount(palier);
                setCustom('');
              }}
              data-active={!custom && amount === palier}
              className="rounded-full border border-ink/15 px-5 py-2.5 font-display text-[0.9375rem] font-semibold text-ink transition-colors hover:border-ink/40 data-[active=true]:border-transparent data-[active=true]:bg-ink data-[active=true]:text-paper"
            >
              {formatXof(palier)}
            </button>
          ))}
        </div>

        <div className="mt-4 max-w-xs">
          <TextField
            id="member-custom"
            name="customAmount"
            type="number"
            label="Ou un autre montant"
            min={MINIMUM}
            step={500}
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
          />
        </div>

        {tooLow && custom !== '' && (
          <p role="alert" className="mt-2 text-[0.8125rem] text-red-700">
            La cotisation minimale est de {formatXof(MINIMUM)} par mois.
          </p>
        )}
      </fieldset>

      {/* ── Consentements (§2.5.3) ── */}
      <div className="space-y-3 border-t border-ink/10 pt-6">
        <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-ink">
          <input
            type="checkbox"
            name="consentPrivacy"
            required
            className="size-6 shrink-0 accent-[#0B2E15]"
          />
          <span>
            J’accepte que mes données soient traitées conformément à la{' '}
            <a href="/confidentialite" className="link-sweep link-tap font-semibold">
              politique de confidentialité
            </a>
            . <span aria-hidden>*</span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-ink">
          <input
            type="checkbox"
            name="consentNews"
            className="size-6 shrink-0 accent-[#0B2E15]"
          />
          <span>Je souhaite recevoir les informations d’impact et les actualités.</span>
        </label>
      </div>

      <ActionButton type="submit" disabled={pending || tooLow}>
        {pending ? 'Envoi…' : 'Envoyer ma demande'}
      </ActionButton>
    </form>
  );
}
