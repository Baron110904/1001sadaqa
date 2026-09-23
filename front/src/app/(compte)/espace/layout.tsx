import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { getSettings } from '@/lib/api';

/**
 * Coquille des écrans de compte : écran scindé.
 *
 * À gauche, ce que le compte apporte, sur une photographie de terrain très
 * assombrie sous un dégradé vert - le même traitement que le héros de
 * l'accueil, pour que la page reste du même site. À droite, le formulaire
 * seul, sans navigation ni pied de page: rien ne doit détourner de la saisie.
 *
 * Sur téléphone la colonne de gauche disparaît: elle ne porte aucune
 * information nécessaire, et la conserver repousserait le formulaire sous la
 * ligne de flottaison.
 */

const PROMESSES = [
  'L’historique de vos dons et vos reçus',
  'Le suivi de votre adhésion et de vos cotisations',
  'L’état de vos candidatures de bénévolat',
];

export default async function EspaceAuthLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const telephone = settings['contact.phone'] ?? '';

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ── Colonne de présentation ── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 lg:flex xl:p-14">
        <Image
          src="/images/terrain/don-de-vivres.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-60"
        />
        {/* Le dégradé garantit le contraste du texte quelle que soit la photo. */}
        {/* Voile allégé : il garantit encore le contraste du texte, mais
            laisse la photographie se voir. */}
        <div className="bg-ink-gradient absolute inset-0 opacity-70" aria-hidden />
        <div className="grain absolute inset-0" aria-hidden />

        <Link href="/" className="relative flex items-center gap-2.5">
          <Image
            src="/brand/logo.png"
            alt=""
            width={36}
            height={36}
            className="size-9 object-contain"
          />
          <span className="font-display text-[1.0625rem] font-bold tracking-tight text-paper">
            1001&nbsp;SADAQA
          </span>
        </Link>

        <div className="relative max-w-md">
          <p className="eyebrow text-gold">Votre espace</p>
          <h2 className="text-title mt-4 font-display font-bold text-paper">
            Retrouvez vos engagements
          </h2>
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-paper/75">
            Dons, adhésion, cotisations et candidatures: tout ce que vous avez confié à
            l’association, réuni au même endroit.
          </p>

          <ul className="mt-8 space-y-3">
            {PROMESSES.map((promesse) => (
              <li key={promesse} className="flex items-start gap-3 text-[0.9375rem] text-paper/85">
                <Check className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={3} aria-hidden />
                {promesse}
              </li>
            ))}
          </ul>
        </div>

        {telephone && (
          <p className="relative text-[0.8125rem] text-paper/55">
            Besoin d’aide ?{' '}
            <a href={`tel:${telephone.replace(/\s/g, '')}`} className="link-tap font-semibold text-gold">
              {telephone}
            </a>
          </p>
        )}
      </aside>

      {/* ── Colonne du formulaire ── */}
      <main className="flex items-center justify-center bg-[#fbfbf9] px-6 py-12 md:px-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="link-sweep link-tap inline-flex items-center gap-2 text-[0.875rem] text-muted"
          >
            <ArrowLeft className="size-4" strokeWidth={2.2} aria-hidden />
            Retour au site
          </Link>

          <div className="mt-8">{children}</div>

        </div>
      </main>
    </div>
  );
}
