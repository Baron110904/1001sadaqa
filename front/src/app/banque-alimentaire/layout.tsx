import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getSettings } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Banque alimentaire',
  description:
    'Ce que l’entrepôt de 1001 SADAQA contient et ce qui lui manque aujourd’hui, à Cotonou. Niveaux publiés en direct.',
};

/** Les quatre repères de la page, en ancres. */
const SECTIONS = [
  { href: '/banque-alimentaire#besoins', label: 'Besoins' },
  { href: '/banque-alimentaire#stock', label: 'Stock' },
  { href: '/banque-alimentaire#mouvements', label: 'Mouvements' },
  { href: '/banque-alimentaire#agir', label: 'Donner ou demander' },
  { href: '/banque-alimentaire/donateurs', label: 'Donateurs' },
] as const;

/**
 * Coquille de la banque alimentaire.
 *
 * Elle a son propre en-tête et son propre pied : c'est un service distinct du
 * site institutionnel, avec son vocabulaire et son public — des donateurs en
 * nature, pas des lecteurs. Le lien « Site principal » garde le chemin du
 * retour ouvert.
 */
export default async function FoodbankLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="min-h-dvh bg-mist">
      <header className="sticky top-0 z-50 bg-ink">
        {/* `min-w-0` sur le bloc de marque et `truncate` sur son titre : sans
            eux, le nom sur deux lignes poussait le bouton hors de l'écran sur
            un téléphone, et la page défilait latéralement. */}
        <div className="container-page flex h-20 items-center justify-between gap-4 md:gap-6">
          <Link href="/banque-alimentaire" className="flex min-w-0 items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt=""
              width={40}
              height={40}
              priority
              className="size-9 shrink-0 object-contain"
            />
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-[1.0625rem] font-bold tracking-tight text-paper">
                Banque alimentaire
              </span>
              <span className="block truncate text-[0.6875rem] font-semibold tracking-[0.16em] text-paper/50 uppercase">
                1001 SADAQA · Cotonou
              </span>
            </span>
          </Link>

          <nav aria-label="Sections" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {SECTIONS.map((section) => (
                <li key={section.href}>
                  <a
                    href={section.href}
                    className="link-sweep py-1 text-[0.9375rem] text-paper/80 transition-colors hover:text-paper"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/"
                  className="link-sweep inline-flex items-center gap-1 py-1 text-[0.9375rem] text-paper/80 transition-colors hover:text-paper"
                >
                  Site principal
                  <ArrowUpRight className="size-3.5" strokeWidth={2.5} aria-hidden />
                </Link>
              </li>
            </ul>
          </nav>

          <Link
            href="/banque-alimentaire/apporter"
            className="shrink-0 rounded-full bg-gold px-4 py-3 font-display text-[0.8125rem] font-semibold whitespace-nowrap text-ink transition-colors hover:bg-gold-deep sm:px-5 sm:text-[0.875rem]"
          >
            Proposer un don
          </Link>
        </div>
      </header>

      <main id="contenu">{children}</main>

      <footer className="bg-ink-deep py-8 text-paper">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-[0.8125rem]">
          <p className="text-paper/60">
            Banque alimentaire · 1001 SADAQA ·{' '}
            {settings['contact.address'] ?? 'Fidjrossè, Cotonou'}
          </p>

          <nav aria-label="Liens utiles">
            <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
              <li>
                <a href="/banque-alimentaire/donateurs" className="link-sweep link-tap text-paper/75 hover:text-paper">
                  Déposer un don
                </a>
              </li>
              <li>
                <Link
                  href="/communaute/partenaire"
                  className="link-sweep link-tap text-paper/75 hover:text-paper"
                >
                  Devenir partenaire
                </Link>
              </li>
              <li>
                <Link href="/contact" className="link-sweep link-tap text-paper/75 hover:text-paper">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
