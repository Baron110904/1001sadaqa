import { adminFetch, currentUser } from '@/lib/admin/client';
import { AdminHeader, Badge, EmptyState, Panel } from '@/components/admin/ui';
import { UserForm } from '@/components/admin/UserForm';
import { formatDate } from '@/lib/format';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'CONTRIBUTOR';
  isActive: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<User['role'], string> = {
  ADMIN: 'Administrateur',
  EDITOR: 'Éditeur',
  CONTRIBUTOR: 'Contributeur',
};

export default async function UsersPage() {
  const me = await currentUser();
  if (!me) return null;

  if (me.role !== 'ADMIN') {
    return (
      <>
        <AdminHeader title="Utilisateurs" />
        <EmptyState
          title="Accès réservé"
          body="La gestion des comptes relève de l’administration."
        />
      </>
    );
  }

  const users = await adminFetch<User[]>('/users');

  return (
    <>
      <AdminHeader title="Utilisateurs" />

      <UserForm />

      <Panel className="mt-6 overflow-hidden p-0 md:p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse text-left text-[0.875rem]">
            <thead>
              <tr className="border-b border-ink/10 bg-mist">
                {['Nom', 'Adresse', 'Rôle', 'État', 'Créé le', ''].map((heading, index) => (
                  <th
                    key={heading || index}
                    scope="col"
                    className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink"
                  >
                    {heading || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-ink/8 last:border-0">
                  <td className="px-4 py-3 text-ink">
                    {user.name}
                    {user.id === me.id && (
                      <span className="ml-2 text-[0.75rem] text-muted">(vous)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge>{ROLE_LABELS[user.role]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <Badge tone="ok">Actif</Badge>
                    ) : (
                      <Badge tone="off">Désactivé</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserForm user={user} isSelf={user.id === me.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

    </>
  );
}
