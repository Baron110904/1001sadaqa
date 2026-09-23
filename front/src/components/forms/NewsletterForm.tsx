'use client';

import { useActionState, useEffect } from 'react';
import { CircleCheck, Send } from 'lucide-react';
import { subscribeNewsletter, type NewsletterState } from '@/app/actions';
import { TextField } from '@/components/ui/Field';
import { mesurer } from '@/lib/mesure';

/**
 * Inscription à la lettre d'information.
 *
 * Deux champs seulement, et une case de consentement qui n'est jamais
 * pré-cochée : le RGPD demande un acte positif, et une case déjà cochée n'en
 * est pas un.
 *
 * Le message de confirmation est le même que l'adresse ait déjà été inscrite
 * ou non. Répondre « vous êtes déjà inscrit » permettrait à n'importe qui de
 * vérifier si une adresse figure sur la liste.
 */
export function NewsletterForm({ source }: { source: string }) {
  const [etat, envoyer, enCours] = useActionState<NewsletterState | null, FormData>(
    subscribeNewsletter,
    null,
  );

  useEffect(() => {
    if (etat?.ok) mesurer('newsletter_inscrit', { origine: source });
  }, [etat, source]);

  if (etat?.ok) {
    return (
      <p className="flex items-start gap-3 rounded-card bg-leaf/10 px-5 py-4 text-[0.9375rem] text-leaf">
        <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
        Merci, votre inscription est enregistrée. Vous recevrez la prochaine lettre.
      </p>
    );
  }

  return (
    <form action={envoyer} className="max-w-xl">
      <input type="hidden" name="source" value={source} />

      {etat?.message && (
        <p role="alert" className="mb-4 rounded-card bg-red-50 px-4 py-3 text-[0.875rem] text-red-800">
          {etat.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <TextField
          id="lettre-email"
          name="email"
          type="email"
          label="Adresse e-mail"
          autoComplete="email"
          className="flex-1"
          required
        />
        <button
          type="submit"
          disabled={enCours}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 font-display text-[0.875rem] font-semibold text-paper transition-colors hover:bg-ink-deep disabled:opacity-60"
        >
          <Send className="size-4" strokeWidth={2.5} aria-hidden />
          {enCours ? 'Envoi…' : 'S’inscrire'}
        </button>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="consent"
          required
          className="size-6 shrink-0 rounded border-ink/25 text-ink focus:ring-ink/30"
        />
        <span className="text-[0.8125rem] leading-relaxed text-muted">
          J’accepte de recevoir la lettre d’information de 1001 SADAQA. Je peux me
          désinscrire à tout moment, et mon adresse n’est transmise à personne.
        </span>
      </label>
    </form>
  );
}
