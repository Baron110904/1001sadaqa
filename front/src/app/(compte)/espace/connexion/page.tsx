import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CompteForm } from '@/components/forms/CompteForm';
import { compteCourant } from '@/lib/compte/session';

export const metadata: Metadata = {
  title: 'Connexion à votre espace',
  description: 'Accédez à votre espace 1001 SADAQA: dons, adhésion et engagements.',
};

export default async function ConnexionPage() {
  // Déjà connecté: on ne présente pas un formulaire de connexion à quelqu'un
  // qui vient de s'authentifier.
  if (await compteCourant()) redirect('/espace');

  return (
    <>
      <h1 className="font-display text-[1.75rem] font-bold tracking-tight text-ink">
        Se connecter
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        Entrez vos identifiants pour accéder à votre espace.
      </p>

      <div className="mt-8">
        <CompteForm mode="connexion" />
      </div>
    </>
  );
}
