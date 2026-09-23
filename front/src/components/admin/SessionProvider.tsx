'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { AdminUser } from '@/lib/admin/session';

/**
 * Identité de la personne connectée, mise à disposition du navigateur.
 *
 * Le gabarit interroge déjà `/auth/me` une fois, à l'entrée du back-office. La
 * valeur est ensuite passée ici, ce qui évite que chaque écran la redemande :
 * la liste et le gabarit le faisaient tous deux, soit deux appels par clic.
 *
 * Ce n'est pas un contrôle d'accès. Il sert à ne pas afficher ce qui serait de
 * toute façon refusé ; c'est l'API qui tranche, sur chacun de ses points.
 */
const Contexte = createContext<AdminUser | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: AdminUser;
  children: ReactNode;
}) {
  return <Contexte.Provider value={user}>{children}</Contexte.Provider>;
}

export function useSession(): AdminUser {
  const user = useContext(Contexte);
  if (!user) {
    throw new Error('useSession doit être appelé sous SessionProvider.');
  }
  return user;
}
