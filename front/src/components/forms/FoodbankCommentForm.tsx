'use client';

import { useActionState } from 'react';
import { sendFoodbankComment } from '@/app/actions';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';
import type { SubmitResult } from '@/lib/api';

/**
 * Mot d'une personne accompagnée.
 *
 * Il est lu avant de paraître, et la confirmation le dit : sans cela, on
 * chercherait son message sur la page et on le croirait perdu.
 */
export function FoodbankCommentForm() {
  const [state, action, pending] = useActionState<SubmitResult | null, FormData>(
    sendFoodbankComment,
    null,
  );

  if (state?.ok) {
    return (
      <p className="rounded-card border border-leaf/25 bg-leaf/8 px-5 py-6 text-[0.9375rem] leading-relaxed text-ink">
        Merci pour votre mot. Il paraîtra sur cette page une fois lu par l’association.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FormStatus state={state && !state.ok ? 'error' : 'idle'} message={state?.message} />

      <TextField
        id="mot-nom"
        name="authorName"
        label="Votre nom"
        autoComplete="name"
        required
        minLength={2}
      />

      <TextAreaField
        id="mot-message"
        name="message"
        label="Votre mot"
        required
        minLength={10}
        rows={4}
        placeholder="Ce que l’accompagnement a changé pour vous…"
      />

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="isAnonymous"
          className="size-6 shrink-0 rounded border-ink/25 text-ink focus:ring-ink/30"
        />
        <span className="text-sm font-medium text-ink">
          Publier sans mon nom
          <span className="mt-0.5 block text-[0.8125rem] font-normal leading-relaxed text-muted">
            Votre mot paraîtra sous « Une personne accompagnée ».
          </span>
        </span>
      </label>

      <ActionButton type="submit" variant="dark" disabled={pending} withArrow={!pending}>
        {pending ? 'Envoi en cours…' : 'Laisser mon mot'}
      </ActionButton>
    </form>
  );
}
