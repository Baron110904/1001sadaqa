'use client';

import { useActionState, useState } from 'react';
import { Pencil, UserPlus } from 'lucide-react';
import { deleteUser, saveUser, type ActionResult } from '@/app/admin/actions';
import { SelectField, TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';
import { Panel } from './ui';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'CONTRIBUTOR';
  isActive: boolean;
}

const ROLE_OPTIONS = [
  { value: 'CONTRIBUTOR', label: 'Contributeur' },
  { value: 'EDITOR', label: 'Éditeur' },
  { value: 'ADMIN', label: 'Administrateur' },
];

/**
 * Création et modification d'un compte.
 *
 * Sans `user`, c'est un formulaire de création dépliable. Avec `user`, c'est
 * un bouton « Modifier » qui ouvre le même formulaire pré-rempli.
 *
 * En modification, un mot de passe laissé vide signifie « ne pas changer » —
 * l'écran n'a aucun moyen d'afficher le mot de passe existant, et ne doit pas
 * l'effacer par omission.
 */
export function UserForm({ user, isSelf }: { user?: UserRecord; isSelf?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveUser, null);

  const editing = Boolean(user);

  if (!open) {
    return editing ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 font-display text-[0.8125rem] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-mist"
      >
        <Pencil className="size-3.5" aria-hidden />
        Modifier
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 font-display text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-gold-deep active:scale-[0.98]"
      >
        <UserPlus className="size-4" strokeWidth={2.5} aria-hidden />
        Créer un compte
      </button>
    );
  }

  const form = (
    <form action={action} className="space-y-4 text-left">
      {user && <input type="hidden" name="__id" value={user.id} />}

      <FormStatus
        state={state ? (state.ok ? 'success' : 'error') : 'idle'}
        message={state?.message}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          id={`user-name-${user?.id ?? 'new'}`}
          name="name"
          label="Nom"
          hideLabel={false}
          defaultValue={user?.name ?? ''}
          required
          minLength={2}
        />
        <TextField
          id={`user-email-${user?.id ?? 'new'}`}
          name="email"
          type="email"
          label="Adresse e-mail"
          hideLabel={false}
          defaultValue={user?.email ?? ''}
          required
        />

        <SelectField
          id={`user-role-${user?.id ?? 'new'}`}
          name="role"
          label="Rôle"
          defaultValue={user?.role ?? 'EDITOR'}
          disabled={isSelf}
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <TextField
          id={`user-password-${user?.id ?? 'new'}`}
          name="password"
          type="password"
          label={editing ? 'Nouveau mot de passe' : 'Mot de passe'}
          hideLabel={false}
          autoComplete="new-password"
          required={!editing}
          minLength={10}
          placeholder={editing ? 'laisser vide pour ne pas changer' : undefined}
        />
      </div>

      <p className="text-[0.8125rem] text-muted">
        Dix caractères au minimum. {isSelf && 'Vous ne pouvez pas modifier votre propre rôle.'}
      </p>

      {editing && (
        <label className="flex cursor-pointer items-center gap-2.5 text-[0.875rem] text-ink">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={user?.isActive}
            disabled={isSelf}
            className="size-4 accent-[#0B2E15]"
          />
          Compte actif
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
        <ActionButton type="submit" variant="dark" size="sm" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </ActionButton>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-ink/15 px-4 py-2 font-display text-[0.8125rem] font-semibold text-ink transition-colors hover:bg-mist"
        >
          Fermer
        </button>

        {editing && !isSelf && (
          <>
            <span className="flex-1" />
            <button
              type="submit"
              formAction={deleteUser}
              className="rounded-full border border-ink/15 px-4 py-2 font-display text-[0.8125rem] font-semibold text-muted transition-colors hover:border-red-600/40 hover:bg-red-50 hover:text-red-800"
            >
              Supprimer ou désactiver
            </button>
          </>
        )}
      </div>
    </form>
  );

  // En modification, le formulaire s'ouvre dans la ligne du tableau ; en
  // création, il occupe son propre cadre.
  return editing ? (
    <div className="mt-3 rounded-card border border-ink/10 bg-mist p-4">{form}</div>
  ) : (
    <Panel>
      <h2 className="mb-4 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
        Nouveau compte
      </h2>
      {form}
    </Panel>
  );
}
