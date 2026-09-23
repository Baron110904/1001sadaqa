import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CompteForm } from '@/components/forms/CompteForm';
import { compteCourant } from '@/lib/compte/session';

export const metadata: Metadata = {
  title: 'Créer votre espace',
  description: 'Créez votre compte 1001 SADAQA pour suivre vos dons et vos engagements.',
};

export default async function InscriptionPage() {
  if (await compteCourant()) redirect('/espace');

  return (
    <>
      <h1 className="font-display text-[1.75rem] font-bold tracking-tight text-ink">
        Créer votre compte
      </h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
        Si vous avez déjà écrit à l’association avec cette adresse, vos envois y seront
        rattachés automatiquement.
      </p>

      <div className="mt-8">
        <CompteForm mode="inscription" />
      </div>
    </>
  );
}
