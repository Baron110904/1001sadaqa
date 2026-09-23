'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { creerCompte, ouvrirSession, type EtatCompte } from '@/lib/compte/actions';
import { TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';

/**
 * Connexion et création de compte.
 *
 * Un seul composant pour les deux : les champs communs, le traitement des
 * erreurs et l'état d'envoi sont identiques, et les faire diverger produirait
 * tôt ou tard deux comportements différents pour un même geste.
 */
export function CompteForm({ mode }: { mode: 'connexion' | 'inscription' }) {
  const inscription = mode === 'inscription';
  const action = inscription ? creerCompte : ouvrirSession;

  const [etat, envoyer, enCours] = useActionState<EtatCompte | null, FormData>(action, null);

  return (
    <form action={envoyer} className="mx-auto max-w-md">
      {etat?.message && (
        <p
          role="alert"
          className="mb-6 rounded-card bg-red-50 px-4 py-3 text-[0.9375rem] text-red-800"
        >
          {etat.message}
        </p>
      )}

      <div className="grid gap-5">
        {inscription && (
          <TextField
            id="compte-nom"
            name="name"
            hideLabel={false}
          label="Nom et prénom"
            autoComplete="name"
            required
          />
        )}

        <TextField
          id="compte-email"
          name="email"
          type="email"
          hideLabel={false}
          label="Adresse e-mail"
          autoComplete="email"
          required
        />

        {inscription && (
          <TextField
            id="compte-tel"
            name="phone"
            type="tel"
            hideLabel={false}
          label="Téléphone (facultatif)"
            autoComplete="tel"
          />
        )}

        <TextField
          id="compte-mdp"
          name="password"
          type="password"
          hideLabel={false}
          label="Mot de passe"
          autoComplete={inscription ? 'new-password' : 'current-password'}
          minLength={inscription ? 8 : undefined}
          required
        />

        {inscription && (
          <p className="text-[0.8125rem] text-muted">
            Huit caractères au minimum. Une phrase longue protège mieux qu'un mot
            court compliqué.
          </p>
        )}
      </div>

      <ActionButton type="submit" className="mt-7 w-full justify-center" disabled={enCours}>
        {enCours
          ? 'Un instant…'
          : inscription
            ? 'Créer mon compte'
            : 'Me connecter'}
      </ActionButton>

      <p className="mt-6 text-center text-[0.875rem] text-muted">
        {inscription ? 'Vous avez déjà un compte ? ' : 'Pas encore de compte ? '}
        <Link
          href={inscription ? '/espace/connexion' : '/espace/inscription'}
          className="link-sweep link-tap font-display font-semibold text-ink"
        >
          {inscription ? 'Se connecter' : 'En créer un'}
        </Link>
      </p>
    </form>
  );
}
