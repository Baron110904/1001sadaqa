'use client';

import { ApiDown } from '@/components/admin/ApiDown';

/**
 * Écran de panne des pages du back-office.
 *
 * Il couvre les erreurs levées par les pages, pas par le gabarit : une
 * frontière d'erreur n'attrape pas ce que son propre gabarit lève. Le gabarit
 * traite donc son cas lui-même — voir `admin/layout.tsx`.
 */
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return <ApiDown onRetry={reset} />;
}
