import type { Metadata } from 'next';
import { text } from '@/lib/text';
import { getPrograms, getSeasonalCampaign, getSettings } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { DonationForm } from '@/components/forms/DonationForm';
import { offres } from '@/lib/seasonal';
import { headingLines } from '@/lib/heading';

export function generateMetadata(): Metadata {
  const t = text('donate');
  return { title: t('eyebrow') };
}

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ montant?: string; email?: string; programme?: string }>;
}) {
  const query = await searchParams;

  const t = text('donate');

  const [programs, settings, campaign] = await Promise.all([
    getPrograms(),
    getSettings(),
    getSeasonalCampaign(),
  ]);

  const amount = query.montant ? Number(query.montant) : undefined;

  // Les offres de la campagne en cours, s'il y en a une qui en propose.
  //
  // Elles ne forment plus une section au-dessus de la page : ce sont des
  // montants, leur place est dans l'étape « 2 - Montant », à côté des montants
  // ordinaires. En tête de page, elles doublaient le choix du montant à deux
  // endroits éloignés, et la carte cliquée depuis l'accueil n'avait aucun
  // équivalent visible une fois le formulaire atteint.
  const campagne =
    campaign && campaign.theme !== 'AUCUN' && campaign.offers.length > 0 ? campaign : null;

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} lines={headingLines(t('title'))} />

      <section className="container-page py-16 md:py-24">
        <DonationForm
          programs={programs.map(({ id, title, slug, shortLabel }) => ({
            id,
            title,
            slug,
            shortLabel,
          }))}
          payment={settings.payment}
          seasonal={
            campagne
              ? { label: campagne.pillLabel ?? campagne.name, offers: offres(campagne) }
              : null
          }
          initial={{
            amount: Number.isFinite(amount) && amount ? amount : undefined,
            email: query.email,
            programSlug: query.programme,
          }}
        />
      </section>
    </>
  );
}
