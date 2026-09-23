'use client';

import { useActionState } from 'react';
import { login, type ActionResult } from '@/app/admin/actions';
import { TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(login, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <h1 className="font-display text-heading font-bold tracking-tight text-ink">Connexion</h1>
        <p className="mt-1.5 text-sm text-muted">
          Identifiants fournis par l’administrateur du site.
        </p>
      </div>

      <FormStatus state={state && !state.ok ? 'error' : 'idle'} message={state?.message} />

      {/* Destination mémorisée par le middleware, reprise après connexion. */}
      {next && <input type="hidden" name="suite" value={next} />}

      <TextField
        id="login-email"
        name="email"
        type="email"
        label="Adresse e-mail"
        hideLabel={false}
        autoComplete="username"
        required
        autoFocus
      />

      <TextField
        id="login-password"
        name="password"
        type="password"
        label="Mot de passe"
        hideLabel={false}
        autoComplete="current-password"
        required
      />

      <ActionButton type="submit" variant="dark" disabled={pending} className="w-full">
        {pending ? 'Connexion…' : 'Se connecter'}
      </ActionButton>
    </form>
  );
}
