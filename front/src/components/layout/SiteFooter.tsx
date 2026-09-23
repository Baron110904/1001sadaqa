import { text } from '@/lib/text';
import { Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import type { SiteSettings } from '@/lib/types';
import { whatsappLink } from '@/lib/format';

interface Column {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}

export async function SiteFooter({ settings }: { settings: SiteSettings }) {
  const t = text('footer');
  const tCommon = text('common');

  const phone = settings['contact.phone'] ?? '';
  const email = settings['contact.email'] ?? '';
  const address = settings['contact.address'] ?? '';
  const whatsapp = settings['contact.whatsapp'] ?? '';
  const facebook = settings['social.facebook'];
  const linkedin = settings['social.linkedin'];

  const columns: Column[] = [
    {
      title: t('act'),
      links: [
        { label: t('donate'), href: '/communaute/donateur' },
        { label: t('becomeVolunteer'), href: '/communaute/benevole' },
        { label: t('becomePartner'), href: '/communaute/partenaire' },
      ],
    },
    {
      title: t('discover'),
      links: [
        { label: t('about'), href: '/a-propos' },
        { label: t('programs'), href: '/programmes' },
        { label: t('projects'), href: '/projets' },
        { label: t('news'), href: '/actualites' },
      ],
    },
    {
      title: t('follow'),
      // Un réseau sans adresse renseignée en back-office n'apparaît pas :
      // mieux vaut une colonne plus courte qu'un lien mort.
      links: [
        ...(facebook ? [{ label: t('facebook'), href: facebook, external: true }] : []),
        ...(linkedin ? [{ label: t('linkedin'), href: linkedin, external: true }] : []),
        ...(whatsapp
          ? [
              {
                label: t('whatsapp'),
                href: whatsappLink(whatsapp, tCommon('whatsappMessage')),
                external: true,
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-ink-deep text-paper">
      <div className="grain absolute inset-0" aria-hidden />

      <div className="container-page relative py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="font-display text-xl font-bold tracking-tight">1001 SADAQA</p>

            <address className="mt-5 space-y-3 text-sm not-italic text-paper/65">
              {address && (
                <span className="flex gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                  <span>{address}</span>
                </span>
              )}
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="link-sweep link-tap flex w-fit gap-2.5 transition-colors hover:text-paper"
                >
                  <Phone className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                  {phone}
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="link-sweep link-tap flex w-fit gap-2.5 transition-colors hover:text-paper"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                  {email}
                </a>
              )}
            </address>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="eyebrow mb-5 text-gold">{column.title}</p>
              <ul className="space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="link-sweep link-tap text-paper/65 transition-colors duration-200 hover:text-paper"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="link-sweep link-tap text-paper/65 transition-colors duration-200 hover:text-paper"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-paper/12 pt-7 text-xs text-paper/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('rights')}</p>
          <Link href="/credits" className="link-sweep link-tap transition-colors hover:text-paper/80">
            {t('credits')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
