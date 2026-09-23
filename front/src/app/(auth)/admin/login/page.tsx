import type { Metadata } from 'next';
import Image from 'next/image';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'Connexion au back-office',
  robots: { index: false, follow: false },
};

/**
 * Écran de connexion.
 *
 * Il vit hors du gabarit `app/admin` : celui-ci exige une session valide, ce
 * qui provoquerait une redirection en boucle sur cette page.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string; session?: string }>;
}) {
  const { suite, session } = await searchParams;
  const expired = session === 'expiree';

  return (
    <main className="bg-ink-gradient grain relative isolate flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/brand/logo.png"
            alt=""
            width={64}
            height={64}
            priority
            className="size-14 object-contain"
          />
          <p className="mt-4 font-display text-xl font-bold tracking-tight text-paper">
            1001&nbsp;SADAQA
          </p>
          <p className="mt-1 text-sm text-paper/60">Administration du site</p>
        </div>

        {expired && (
          <p
            role="status"
            className="mb-4 rounded-card border border-gold/40 bg-gold/12 px-4 py-3 text-[0.875rem] text-paper"
          >
            Votre session a expiré. Reconnectez-vous pour continuer.
          </p>
        )}

        <div className="rounded-panel bg-paper p-6 shadow-lift md:p-8">
          <LoginForm next={suite} />
        </div>

        <p className="mt-6 text-center text-[0.75rem] leading-relaxed text-paper/45">
          Espace réservé à l’équipe de l’association.
          <br />
          En cas de perte d’accès, contactez l’administrateur du site.
        </p>
      </div>
    </main>
  );
}
