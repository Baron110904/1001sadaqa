'use client';

import { useActionState } from 'react';
import { text } from '@/lib/text';
import { sendPartnership } from '@/app/actions';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';
import type { SubmitResult } from '@/lib/api';

export function PartnershipForm() {
  const t = text('partners.form');
  const tCommon = text('common');
  const [state, action, pending] = useActionState<SubmitResult | null, FormData>(
    sendPartnership,
    null,
  );

  const success = state?.ok === true;

  return (
    <form action={action} className="space-y-4">
      <FormStatus
        state={state ? (success ? 'success' : 'error') : 'idle'}
        message={success ? t('success') : state?.message}
      />

      {!success && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="part-organisation"
              name="organisation"
              label={t('organisation')}
              autoComplete="organization"
              required
              minLength={2}
            />
            <TextField
              id="part-contact"
              name="contactName"
              label={t('contactName')}
              autoComplete="name"
              required
              minLength={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="part-email"
              name="email"
              type="email"
              label={t('email')}
              autoComplete="email"
              required
            />
            <TextField
              id="part-phone"
              name="phone"
              type="tel"
              label={t('phone')}
              autoComplete="tel"
            />
          </div>

          <TextAreaField
            id="part-intent"
            name="intent"
            label={t('intent')}
            required
            minLength={10}
            rows={5}
          />

          <ActionButton type="submit" disabled={pending} withArrow={!pending}>
            {pending ? tCommon('sending') : t('submit')}
          </ActionButton>
        </>
      )}
    </form>
  );
}
