import type { Metadata } from 'next';
import { Lien as Link } from '@/components/ui/Lien';
import { ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import { getFoodbankMovements } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { poserLaLangueDe, langueCourante } from '@/lib/langue';
import { canoniquePour } from '@/lib/seo';
import { text } from '@/lib/text';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const langue = await poserLaLangueDe(params);
  const t = text('foodbank.register');
  return { title: t('metaTitle'), description: t('metaDescription'), alternates: canoniquePour('/banque-alimentaire/registre', langue) };
}

/**
 * Registre complet.
 *
 * C'est la contrepartie de la page d'accueil : celle-ci résume, celle-ci
 * détaille. Publier le registre est ce qui rend le don vérifiable — un
 * donateur peut retrouver son apport et voir ce qu'il est devenu.
 */
export default async function RegistrePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await poserLaLangueDe(params);
  const t = text('foodbank.register');
  const tBanque = text('foodbank');
  // La date suit la langue de la page : « 5 octobre 2026 » ou « 5 October 2026 ».
  const locale = langueCourante() === 'fr' ? 'fr-FR' : 'en-GB';
  const mouvements = await getFoodbankMovements(200);

  return (
    <section className="container-page py-14 md:py-20">
      <Link
        href="/banque-alimentaire"
        className="link-sweep link-tap inline-flex items-center gap-2 font-display text-[0.875rem] font-semibold text-ink"
      >
        <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden />
        {tBanque('backLink')}
      </Link>

      <h1 className="text-title mt-6 font-display font-bold text-ink">{t('title')}</h1>
      <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
        {t('lead')}
        {mouvements.length > 0 && ` ${mouvements.length} ${t('countSuffix')}`}
      </p>

      {mouvements.length === 0 ? (
        <p className="mt-10 text-[0.9375rem] text-muted">{t('empty')}</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-panel border border-ink/10 bg-paper">
          <table className="w-full min-w-176 border-collapse text-left text-[0.875rem]">
            <thead>
              <tr className="border-b border-ink/10 bg-mist">
                <th scope="col" className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink">
                  {t('colDirection')}
                </th>
                <th scope="col" className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink">
                  {t('colCategory')}
                </th>
                <th scope="col" className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink">
                  {t('colQuantity')}
                </th>
                <th scope="col" className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink">
                  {t('colCounterpart')}
                </th>
                <th scope="col" className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink">
                  {t('colDate')}
                </th>
              </tr>
            </thead>
            <tbody>
              {mouvements.map((mouvement) => {
                const entree = mouvement.direction === 'ENTREE';
                const Icone = entree ? ArrowDown : ArrowUp;

                return (
                  <tr key={mouvement.id} className="border-b border-ink/8 last:border-0">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-[0.6875rem] font-bold tracking-wide uppercase ${
                          entree ? 'bg-leaf/12 text-leaf' : 'bg-gold/20 text-gold-deep'
                        }`}
                      >
                        <Icone className="size-3" strokeWidth={3} aria-hidden />
                        {entree ? t('in') : t('out')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink">{mouvement.category.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink tabular">
                      {formatNumber(mouvement.quantity)} {mouvement.category.unit}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-ink">{mouvement.counterpart}</span>
                      {mouvement.detail && (
                        <span className="mt-0.5 block text-[0.8125rem] text-muted">
                          {mouvement.detail}
                          {mouvement.peopleServed
                            ? ` · ${formatNumber(mouvement.peopleServed)} ${t('peopleServed')}`
                            : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {new Date(mouvement.occurredAt).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
