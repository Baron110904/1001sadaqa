import { adminFetch, currentUser } from '@/lib/admin/client';
import { AdminHeader, Badge, EmptyState, Panel } from '@/components/admin/ui';
import { SettingRow } from '@/components/admin/SettingRow';

interface Setting {
  key: string;
  group: string;
  label: string;
  value: unknown;
  isSecret: boolean;
  isSet: boolean;
}

const GROUPS: { key: string; title: string }[] = [
  { key: 'GENERAL', title: 'Général' },
  { key: 'CONTACT', title: 'Coordonnées' },
  { key: 'SOCIAL', title: 'Réseaux sociaux' },
  { key: 'PAYMENT', title: 'Passerelle de paiement' },
  { key: 'ANALYTICS', title: 'Mesure d’audience' },
];

/**
 * Agrégateur de paiement de l'association : FedaPay, et lui seul.
 *
 * Il n'y a plus de liste à dérouler — un menu à une entrée unique laisserait
 * croire qu'il reste une décision à prendre. Le nom est affiché, pas choisi.
 */
const FOURNISSEUR = 'FedaPay';

/** Nature du champ, déduite de la valeur enregistrée. */
function kindOf(setting: Setting): 'text' | 'boolean' | 'number' | 'list' | 'select' {
  if (typeof setting.value === 'boolean') return 'boolean';
  if (typeof setting.value === 'number') return 'number';
  if (Array.isArray(setting.value)) return 'list';
  // Une clé secrète est renvoyée à null : on la traite comme du texte.
  return 'text';
}

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) return null;

  if (user.role !== 'ADMIN') {
    return (
      <>
        <AdminHeader title="Paramètres" />
        <EmptyState
          title="Accès réservé"
          body="Les paramètres du site relèvent de l’administration."
        />
      </>
    );
  }

  const settings = await adminFetch<Setting[]>('/settings');
  const payment = settings.find((setting) => setting.key === 'payment.enabled');

  return (
    <>
      <AdminHeader title="Paramètres" />

      <Panel className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-[0.9375rem] font-bold text-ink">
              État de la passerelle de paiement
            </p>
            <p className="mt-1 text-[0.875rem] text-muted">
              Agrégateur : {FOURNISSEUR}
            </p>
          </div>
          {payment?.value === true ? (
            <Badge tone="ok">Active</Badge>
          ) : (
            <Badge tone="wait">Inactive - dons en attente</Badge>
          )}
        </div>
      </Panel>

      <div className="space-y-6">
        {GROUPS.map((group) => {
          const rows = settings.filter((setting) => setting.group === group.key);
          if (!rows.length) return null;

          return (
            <Panel key={group.key}>
              <h2 className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                {group.title}
              </h2>
              <ul className="mt-5 divide-y divide-ink/10 border-t border-ink/10">
                {rows.map((setting) => (
                  <li key={setting.key} className="py-4">
                    <SettingRow
                      settingKey={setting.key}
                      label={setting.label}
                      kind={kindOf(setting)}
                      value={setting.value}
                      isSecret={setting.isSecret}
                      isSet={setting.isSet}
                    />
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
