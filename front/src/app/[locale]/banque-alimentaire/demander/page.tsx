import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getFoodbank } from '@/lib/api';
import { FoodbankRequestForm } from '@/components/forms/FoodbankRequestForm';

export const metadata: Metadata = {
  title: 'Demander une denrée',
  description:
    'Adressez une demande à la banque alimentaire de 1001 SADAQA : choisissez un article disponible et la quantité dont vous avez besoin.',
};

/**
 * Demander une denrée.
 *
 * La banque ne sert pas qu'à recevoir. Le choix est limité à ce qu'elle gère
 * réellement : proposer un article absent de la réserve reviendrait à faire
 * espérer pour rien.
 */
export default async function DemanderPage() {
  const banque = await getFoodbank();

  // On ne propose que ce qu'il y a en réserve : une demande sur un article
  // épuisé serait refusée à la validation, après une attente inutile.
  const disponibles = banque.categories.filter((categorie) => categorie.quantity > 0);

  return (
    <section className="container-page py-14 md:py-20">
      <Link
        href="/banque-alimentaire"
        className="link-sweep link-tap inline-flex items-center gap-2 font-display text-[0.875rem] font-semibold text-ink"
      >
        <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden />
        Banque alimentaire
      </Link>

      <h1 className="text-title mt-6 font-display font-bold text-ink">Demander une denrée</h1>
      <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
        Indiquez l’article dont vous avez besoin et la quantité. Votre demande est examinée par
        l’association, qui vous recontacte.
      </p>

      <div className="mt-10 max-w-2xl">
        {disponibles.length === 0 ? (
          <p className="rounded-panel border border-ink/10 bg-mist px-6 py-10 text-center text-[0.9375rem] leading-relaxed text-muted">
            La réserve est vide pour le moment. Revenez d’ici quelques jours, ou{' '}
            <Link href="/contact" className="link-sweep font-semibold text-ink">
              écrivez-nous
            </Link>{' '}
            si votre situation est urgente.
          </p>
        ) : (
          <FoodbankRequestForm kind="RETRAIT" categories={disponibles} />
        )}
      </div>
    </section>
  );
}
