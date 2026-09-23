'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Pencil, Plus } from 'lucide-react';
import { adminApi, SessionFinie } from '@/lib/admin/browser';
import {
  canDelete,
  canWrite,
  findResource,
  type ColumnDef,
  type ResourceDef,
} from '@/lib/admin/resources';
import { useSession } from '@/components/admin/SessionProvider';
import { AdminHeader, Badge, EmptyState, Panel } from '@/components/admin/ui';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { formatNumber } from '@/lib/format';

type Row = Record<string, unknown>;

/** Étiquettes lisibles des valeurs d'énumération renvoyées par l'API. */
const LABELS: Record<string, { text: string; tone: 'ok' | 'wait' | 'off' | 'neutral' }> = {
  DRAFT: { text: 'Brouillon', tone: 'off' },
  PUBLISHED: { text: 'En cours', tone: 'ok' },
  COMPLETED: { text: 'Terminé', tone: 'neutral' },
  CANCELLED: { text: 'Annulé', tone: 'off' },
  // États d'avancement des programmes et des projets.
  ACTIF: { text: 'Actif', tone: 'ok' },
  REALISE: { text: 'Réalisé', tone: 'neutral' },
  EN_COURS: { text: 'En cours', tone: 'ok' },
  A_FINANCER: { text: 'À financer', tone: 'wait' },
  EN_PREPARATION: { text: 'En préparation', tone: 'off' },
  // Banque alimentaire : niveaux de stock et sens d'un mouvement.
  CRITIQUE: { text: 'Critique', tone: 'wait' },
  BAS: { text: 'Bas', tone: 'wait' },
  OK: { text: 'Suffisant', tone: 'ok' },
  ENTREE: { text: 'Entrée', tone: 'ok' },
  SORTIE: { text: 'Sortie', tone: 'neutral' },
  TERRAIN: { text: 'Terrain', tone: 'neutral' },
  COMMUNIQUE: { text: 'Communiqué', tone: 'neutral' },
  PARTENARIAT: { text: 'Partenariat', tone: 'neutral' },
  INSTITUTION: { text: 'Institution', tone: 'neutral' },
  BENEFICIARY: { text: 'Bénéficiaire', tone: 'neutral' },
  VOLUNTEER: { text: 'Bénévole', tone: 'neutral' },
  PARTNER: { text: 'Partenaire', tone: 'neutral' },
  ENTERPRISE: { text: 'Entreprise', tone: 'neutral' },
  FOUNDATION: { text: 'Fondation', tone: 'neutral' },
  NGO: { text: 'ONG', tone: 'neutral' },
  FIELD: { text: 'Terrain', tone: 'neutral' },
  SKILLS: { text: 'Compétences', tone: 'neutral' },
};

function Cell({ column, row }: { column: ColumnDef; row: Row }) {
  const raw = row[column.name];

  if (column.kind === 'boolean') {
    return raw ? <Badge tone="ok">Oui</Badge> : <Badge tone="off">Non</Badge>;
  }

  if (column.kind === 'badge') {
    const key = String(raw ?? '');
    const label = LABELS[key];
    return label ? <Badge tone={label.tone}>{label.text}</Badge> : <span>{key || ' - '}</span>;
  }

  if (column.kind === 'number') {
    return (
      <span className="tabular">
        {typeof raw === 'number' ? formatNumber(raw) : String(raw ?? '') || ' - '}
      </span>
    );
  }

  if (column.kind === 'image') {
    const src = typeof raw === 'string' && raw ? raw : null;
    return (
      <span className="relative flex size-11 items-center justify-center overflow-hidden rounded-card bg-sand">
        {src ? (
          <Image src={src} alt="" fill sizes="44px" className="object-contain" />
        ) : (
          <span className="text-[0.625rem] font-bold text-ink/30"> - </span>
        )}
      </span>
    );
  }

  return <span className="text-ink">{String(raw ?? '') || ' - '}</span>;
}

/**
 * Silhouette d'attente, à la forme du tableau qu'elle remplace.
 *
 * `aria-busy` est porté par une enveloppe et non par `Panel` : ce dernier ne
 * transmet pas les attributs qu'il ne déclare pas, et JSX laisse passer les
 * `aria-*` sans erreur — l'annonce se perdait donc en silence.
 */
function Squelette() {
  return (
    <div aria-busy="true" aria-live="polite">
      <Panel className="overflow-hidden">
        <span className="sr-only">Chargement…</span>
        <span className="mb-4 block h-10 animate-pulse rounded-lg bg-mist" />
        {[0, 1, 2, 3].map((ligne) => (
          <span
            key={ligne}
            className="mb-3 block h-11 animate-pulse rounded-lg bg-ink/5 last:mb-0"
            style={{ opacity: 1 - ligne * 0.18 }}
          />
        ))}
      </Panel>
    </div>
  );
}

/**
 * Liste d'un contenu, chargée depuis le navigateur.
 *
 * Ce rendu côté client est ce qui rend la navigation immédiate : changer de
 * rubrique ne demande plus un rendu serveur complet — garde, gabarit, lecture,
 * sérialisation — mais un seul appel à l'API. Les écritures restent des actions
 * serveur : elles seules peuvent invalider le cache du site public.
 *
 * Un seul composant sert les neuf contenus, décrits par leur `ResourceDef`.
 */
export function ResourceTable({ resource }: { resource: ResourceDef }) {
  const user = useSession();
  const query = useSearchParams();

  // Les formulaires de création et de modification redirigent ici avec un
  // marqueur : le retour survit ainsi au chargement de la liste. On n'en garde
  // que la valeur, pas l'objet : `useSearchParams` en renvoie un nouveau à
  // chaque rendu, et le placer en dépendance relançait la lecture en boucle.
  const enregistre = query.get('enregistre');
  const erreurRecue = query.get('erreur');

  const [rows, setRows] = useState<Row[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(erreurRecue);
  const [message, setMessage] = useState<string | null>(
    enregistre ? 'Contenu enregistré.' : null,
  );

  const autorise = canWrite(resource, user);
  const supprimable = canDelete(resource, user);

  // On ne propose que les rubriques voisines réellement ouvertes à ce rôle.
  const voisines = (resource.siblings ?? [])
    .map((slug) => findResource(slug))
    .filter((voisine): voisine is ResourceDef => Boolean(voisine) && canWrite(voisine!, user));

  const charger = useCallback(
    async (signal: AbortSignal) => {
      setErreur(null);
      try {
        setRows(await adminApi<Row[]>(resource.paths.list, { signal }));
      } catch (cause) {
        // Lecture abandonnée : on a changé de rubrique entre-temps.
        if (signal.aborted) return;
        if (cause instanceof SessionFinie) {
          window.location.href = '/admin/login?session=expiree';
          return;
        }
        setRows([]);
        setErreur(cause instanceof Error ? cause.message : 'Lecture impossible.');
      }
    },
    [resource.paths.list],
  );

  useEffect(() => {
    // L'abandon au démontage évite qu'une réponse tardive n'écrase la liste
    // d'une autre rubrique, et neutralise le double appel du mode strict.
    const abandon = new AbortController();
    setRows(null);
    void charger(abandon.signal);
    return () => abandon.abort();
  }, [charger]);

  // On n'affiche pas une rubrique fermée à ce rôle : l'API la refuserait.
  if (!autorise) {
    return (
      <>
        <AdminHeader title={resource.label} />
        <EmptyState
          title="Rubrique non accessible"
          body="Contactez l’administrateur du site si vous avez besoin de cet accès."
        />
      </>
    );
  }

  const ajouter = (
    <Link
      href={`/admin/${resource.slug}/nouveau`}
      className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 font-display text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-gold-deep active:scale-[0.98]"
    >
      <Plus className="size-4" strokeWidth={2.5} aria-hidden />
      Ajouter {resource.feminine ? 'une' : 'un'} {resource.labelOne}
    </Link>
  );

  return (
    <>
      <AdminHeader title={resource.label} actions={ajouter} />

      {/* Onglets des rubriques voisines. La navigation les range sur une seule
          ligne - « Projets · Causes » - et c'est ici qu'on passe de l'une à
          l'autre. */}
      {voisines.length > 0 && (
        <nav aria-label="Rubriques voisines" className="mb-6 flex flex-wrap gap-2">
          {[resource, ...voisines].map((rubrique) => (
            <Link
              key={rubrique.slug}
              href={`/admin/${rubrique.slug}`}
              aria-current={rubrique.slug === resource.slug ? 'page' : undefined}
              className={`rounded-full border px-4 py-2 font-display text-[0.8125rem] font-semibold transition-colors ${
                rubrique.slug === resource.slug
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/15 text-ink hover:border-ink/40 hover:bg-mist'
              }`}
            >
              {rubrique.label}
            </Link>
          ))}
        </nav>
      )}

      {message && (
        <p role="status" className="mb-6 rounded-card bg-leaf/10 px-4 py-3 text-[0.9375rem] text-leaf">
          {message}
        </p>
      )}
      {erreur && (
        <p role="alert" className="mb-6 rounded-card bg-red-50 px-4 py-3 text-[0.9375rem] text-red-800">
          {erreur}
        </p>
      )}

      {rows === null ? (
        <Squelette />
      ) : rows.length === 0 ? (
        <EmptyState
          title={`Aucun${resource.feminine ? 'e' : ''} ${resource.labelOne} pour le moment`}
          body={
            resource.feminine
              ? 'Créez la première pour qu’elle apparaisse sur le site.'
              : 'Créez le premier pour qu’il apparaisse sur le site.'
          }
          action={
            <Link
              href={`/admin/${resource.slug}/nouveau`}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-display text-[0.9375rem] font-semibold text-paper"
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
              Ajouter {resource.feminine ? 'une' : 'un'} {resource.labelOne}
            </Link>
          }
        />
      ) : (
        <Panel className="overflow-hidden p-0 md:p-0">
          {/* Le tableau défile dans son propre cadre : la page ne déborde pas. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-ink/10 bg-mist">
                  {resource.columns.map((column) => (
                    <th
                      key={column.name}
                      scope="col"
                      className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const id = String(row.id);
                  const nom = String(row.title ?? row.name ?? 'cet élément');

                  return (
                    <tr key={id} className="border-b border-ink/8 last:border-0 hover:bg-mist/60">
                      {resource.columns.map((column) => (
                        <td key={column.name} className="px-4 py-3 align-middle">
                          <Cell column={column} row={row} />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/admin/${resource.slug}/${id}`}
                            // Sans cela, afficher une liste déclenche un rendu
                            // serveur de fiche par ligne — sept pour les
                            // partenaires, autant que d'actualités ensuite —
                            // chacun relisant la liste entière et ses options,
                            // pour une fiche au plus qui sera ouverte. L'attente
                            // du clic reste couverte par `admin/loading.tsx`, et
                            // l'ouverture est mesurée entre 0,3 et 0,7 s.
                            prefetch={false}
                            aria-label={`Modifier ${nom}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 font-display text-[0.8125rem] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-paper"
                          >
                            <Pencil className="size-3.5" aria-hidden />
                            Modifier
                          </Link>

                          {supprimable && (
                            <DeleteButton
                              resourceSlug={resource.slug}
                              id={id}
                              label={nom}
                              onDeleted={() => {
                                setRows((actuelles) =>
                                  (actuelles ?? []).filter((r) => String(r.id) !== id),
                                );
                                setMessage('Contenu supprimé.');
                              }}
                              onError={setErreur}
                            />
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  );
}
