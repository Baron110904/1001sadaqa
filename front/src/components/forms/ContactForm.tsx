'use client';

import { useActionState } from 'react';
import { text } from '@/lib/text';
import { sendContact } from '@/app/actions';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';
import type { SubmitResult } from '@/lib/api';

export function ContactForm() {
  const t = text('contact.form');
  const tCommon = text('common');
  const [state, action, pending] = useActionState<SubmitResult | null, FormData>(
    sendContact,
    null,
  );

  const success = state?.ok === true;

  return (
    <form action={action} className="space-y-4" noValidate={false}>
      <FormStatus
        state={state ? (success ? 'success' : 'error') : 'idle'}
        message={success ? t('success') : state?.message}
      />

      {/* Après un envoi réussi, le formulaire disparaît : rien n'invite à
          renvoyer le même message deux fois. */}
      {!success && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="contact-name" name="name" label={t('name')} autoComplete="name" required minLength={2} />
            <TextField
              id="contact-email"
              name="email"
              type="email"
              label={t('email')}
              autoComplete="email"
              required
            />
          </div>

          {/* Le téléphone reste facultatif : beaucoup de messages n'appellent
              qu'une réponse écrite, et l'exiger ferait renoncer une partie
              des visiteurs. L'API l'acceptait déjà, seul le champ manquait. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="contact-phone"
              name="phone"
              type="tel"
              label={t('phone')}
              autoComplete="tel"
            />
            <TextField id="contact-subject" name="subject" label={t('subject')} required minLength={3} />
          </div>

          <TextAreaField
            id="contact-message"
            name="message"
            label={t('message')}
            required
            minLength={10}
            rows={6}
          />

          <ActionButton type="submit" variant="dark" disabled={pending} withArrow={!pending}>
            {pending ? tCommon('sending') : t('submit')}
          </ActionButton>
        </>
      )}
    </form>
  );
}
