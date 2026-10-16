import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CompteForm } from '@/components/forms/CompteForm';
import { compteCourant } from '@/lib/compte/session';
import { poserLaLangueDe } from '@/lib/langue';
import { canoniquePour } from '@/lib/seo';
import { text } from '@/lib/text';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const langue = await poserLaLangueDe(params);
  const t = text('account.signIn');
  return { title: t('metaTitle'), description: t('metaDescription'), alternates: canoniquePour('/espace/connexion', langue) };
}

export default async function ConnexionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await poserLaLangueDe(params);
  const t = text('account.signIn');
  // Déjà connecté: on ne présente pas un formulaire de connexion à quelqu'un
  // qui vient de s'authentifier.
  if (await compteCourant()) redirect('/espace');

  return (
    <>
      <h1 className="font-display text-[1.75rem] font-bold tracking-tight text-ink">
        {t('title')}
      </h1>
      <p className="mt-2 text-[0.9375rem] text-muted">
        {t('lead')}
      </p>

      <div className="mt-8">
        <CompteForm mode="connexion" />
      </div>
    </>
  );
}
