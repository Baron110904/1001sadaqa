import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getFoodbank } from '@/lib/api';
import { FoodbankRequestForm } from '@/components/forms/FoodbankRequestForm';

export const metadata: Metadata = {
  title: 'Apporter une denrée',
  description:
    'Annoncez ce que vous souhaitez apporter à la banque alimentaire de 1001 SADAQA : article, quantité, coordonnées.',
};

/**
 * Annoncer un apport.
 *
 * La page dit ce qui manque avant de demander quoi que ce soit : un donateur
 * qui apporte du riz alors que la réserve déborde de riz rend un service moins
 * utile que celui qui apporte de l'huile. Les besoins viennent du stock, pas
 * d'une liste tenue à la main.
 */
export default async function ApporterPage() {
  const banque = await getFoodbank();
  const manquants = banque.needs.slice(0, 3);

  return (
    <section className="container-page py-14 md:py-20">
      <Link
        href="/banque-alimentaire"
        className="link-sweep link-tap inline-flex items-center gap-2 font-display text-[0.875rem] font-semibold text-ink"
      >
        <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden />
        Banque alimentaire
      </Link>

      <h1 className="text-title mt-6 font-display font-bold text-ink">Apporter une denrée</h1>
      <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
        Dites-nous ce que vous souhaitez déposer et en quelle quantité. L’association vous
        recontacte pour convenir du moment.
      </p>

      {manquants.length > 0 && (
        <p className="mt-5 max-w-2xl rounded-card border border-gold/40 bg-gold/10 px-5 py-4 text-[0.9375rem] leading-relaxed text-ink">
          <strong className="font-display font-bold">Le plus utile en ce moment :</strong>{' '}
          {manquants.map((article) => article.name).join(', ')}.
        </p>
      )}

      <div className="mt-10 max-w-2xl">
        <FoodbankRequestForm kind="DON" categories={banque.categories} />
      </div>
    </section>
  );
}
