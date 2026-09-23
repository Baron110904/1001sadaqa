import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { adminFetch, currentUser } from '@/lib/admin/client';
import type { DashboardOverview } from '@/lib/admin/dashboard';
import type { AdminUser } from '@/lib/admin/session';
import { resourcesFor } from '@/lib/admin/resources';
import { AdminShell } from '@/components/admin/AdminShell';
import { ApiDown } from '@/components/admin/ApiDown';
import { SessionProvider } from '@/components/admin/SessionProvider';
import { logout } from './actions';

export const metadata: Metadata = {
  title: 'Back-office',
  // Le back-office n'a rien à faire dans un index de recherche.
  robots: { index: false, follow: false },
};

/**
 * Gabarit du back-office.
 *
 * La session est vérifiée ici en interrogeant `/auth/me` : le cookie contrôlé
 * par le middleware prouve seulement qu'un jeton existe, pas qu'il est valide.
 * C'est l'API qui tranche.
 *
 * La page de connexion vit hors de ce gabarit — dans `app/(auth)/admin/login`
 * — précisément pour ne pas dépendre d'une session.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Les deux appels partent ensemble : les compteurs ne dépendent pas de la
  // session, et les enchaîner ajoutait un aller-retour à chaque page.
  //
  // `currentUser` distingue deux échecs : une authentification refusée rend
  // `null`, une API injoignable lève. La panne est traitée ici et non par la
  // frontière d'erreur, qui n'attrape pas ce que son propre gabarit lève.
  let user: AdminUser | null;
  let overview: DashboardOverview | null;

  try {
    [user, overview] = await Promise.all([
      currentUser(),
      adminFetch<DashboardOverview>('/dashboard').catch(() => null),
    ]);
  } catch {
    // Session intacte : on n'efface aucun cookie et on ne renvoie pas au
    // formulaire. Une interruption passagère ne doit pas coûter la saisie en
    // cours.
    return <ApiDown />;
  }

  // Le marqueur `session=expiree` indique au middleware de purger les cookies :
  // un composant serveur ne peut pas les effacer lui-même pendant le rendu.
  if (!user) redirect('/admin/login?session=expiree');

  return (
    <SessionProvider user={user}>
      <AdminShell
        user={user}
        resources={resourcesFor(user)}
        badges={{
          // La pastille « Demandes » additionne les trois natures qui arrivent
          // sur le même écran : messages, bénévoles, partenariats.
          requests:
            (overview?.pending.contacts ?? 0) +
            (overview?.pending.volunteers ?? 0) +
            (overview?.pending.partnerships ?? 0),
          donations: overview?.pending.donations ?? null,
        }}
        logoutSlot={
          <form action={logout}>
            <button type="submit">
              <LogOut className="size-4" aria-hidden />
              Se déconnecter
            </button>
          </form>
        }
      >
        {children}
      </AdminShell>
    </SessionProvider>
  );
}
