import type { Metadata } from 'next';
import { text } from '@/lib/text';
import { Download, FileText } from 'lucide-react';
import { getPartners } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { PartnerLogos } from '@/components/blocks/PartnerLogos';
import { PartnershipForm } from '@/components/forms/PartnershipForm';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { headingLines } from '@/lib/heading';

export function generateMetadata(): Metadata {
  const t = text('partners');
  return { title: t('eyebrow'), description: t('lead') };
}

export default async function PartnersPage() {
  const t = text('partners');
  const tCommon = text('common');
  const partners = await getPartners();

  const offers = ['skills', 'funding', 'inKind'] as const;

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} lines={headingLines(t('title'))} lead={t('lead')} />

      {/* ── Formes de partenariat ────────────────────────────────────── */}
      <section className="container-page py-16 md:py-24">
        <RevealGroup className="grid gap-4 md:grid-cols-3" stagger={0.1} as="ul">
          {offers.map((offer, index) => (
            <RevealItem key={offer} as="li">
              <div className="h-full rounded-panel bg-mist p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-soft">
                <p className="font-display text-sm font-bold text-leaf tabular">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h2 className="mt-3 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                  {t(`offers.${offer}.title`)}
                </h2>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
                  {t(`offers.${offer}.body`)}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* ── Ils nous accompagnent ───────────────────────────────────── */}
        {partners.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display text-title font-bold tracking-tight text-ink">
              {t('partnersTitle')}
            </h2>
            <p className="mt-3 max-w-2xl text-[0.9375rem] text-muted">{t('partnersLead')}</p>

            <div className="mt-8">
              <PartnerLogos partners={partners} />
            </div>
          </div>
        )}

      </section>

      {/* ── Prendre contact ─────────────────────────────────────────── */}
      <section className="container-page pb-20 md:pb-28">
        <Reveal>
          <div className="rounded-panel bg-mist p-6 md:p-10">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="font-display text-title font-bold tracking-tight text-ink">
                  {t('form.title')}
                </h2>
                <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted">
                  {t('form.body')}
                </p>
              </div>

              <PartnershipForm />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
