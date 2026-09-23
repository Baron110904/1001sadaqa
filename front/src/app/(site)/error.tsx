'use client';

import { useEffect } from 'react';
import { text } from '@/lib/text';
import { CircleAlert } from 'lucide-react';
import { ActionButton, ActionLink } from '@/components/ui/Button';

/**
 * Écran d'erreur d'une route.
 *
 * Le message reste générique : aucun détail technique n'est montré au
 * visiteur. La trace part dans la console du serveur, où Sentry la récupère
 * une fois le DSN renseigné.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = text('error');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container-page flex min-h-[60vh] items-center py-20">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
          <CircleAlert className="size-6" aria-hidden />
        </span>

        <h1 className="text-title mt-6 text-ink">{t('title')}</h1>
        <p className="mt-4 text-[0.9375rem] text-muted">{t('body')}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ActionButton type="button" onClick={reset} withArrow={false}>
            {t('retry')}
          </ActionButton>
          <ActionLink href="/" variant="ghost" withArrow={false}>
            {t('home')}
          </ActionLink>
        </div>
      </div>
    </section>
  );
}
