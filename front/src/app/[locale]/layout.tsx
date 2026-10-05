import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { LANGUES, estUneLangue, poserLaLangue } from '@/lib/langue';
import { FournisseurDeLangue } from '@/lib/langue-client';

/**
 * Gabarit de langue : il fixe la langue de tout ce qui se rend en dessous.
 *
 * `poserLaLangue` doit être appelé **ici**, avant le rendu des enfants : c'est
 * ce qui permet aux quatre-vingt-onze appels à `text()` de rester inchangés,
 * en lisant la langue dans l'emplacement de la requête plutôt que de la
 * recevoir en propriété.
 *
 * L'attribut `lang` est posé sur cette enveloppe et non sur `<html>` : la
 * racine du document est partagée avec le back-office, qui reste en français.
 * Un `lang` sur un conteneur est du HTML valide et les lecteurs d'écran le
 * respectent.
 */
export function generateStaticParams() {
  return LANGUES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Une langue inconnue n'est pas une page : `/de/programmes` doit répondre
  // 404 et non servir le français sous une adresse qui ment.
  if (!estUneLangue(locale)) notFound();

  poserLaLangue(locale);

  return (
    <FournisseurDeLangue langue={locale}>
      <div lang={locale}>{children}</div>
    </FournisseurDeLangue>
  );
}
