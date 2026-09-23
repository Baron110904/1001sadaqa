import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { adminFetch, currentUser } from '@/lib/admin/client';
import { canWrite, findResource } from '@/lib/admin/resources';
import { loadDynamicOptions } from '@/lib/admin/options';
import { AdminHeader, EmptyState, Panel } from '@/components/admin/ui';
import { ResourceForm } from '@/components/admin/ResourceForm';
import { ImpactPanel, type Impact } from '@/components/admin/ImpactPanel';

type Row = Record<string, unknown> & { id: string; impacts?: Impact[] };

/** Adresse publique du contenu, quand il en a une. */
function publicUrl(slug: string, row: Row): string | null {
  const path = String(row.slug ?? '');
  if (!path) return null;

  if (slug === 'programmes') return `/programmes/${path}`;
  if (slug === 'projets') return `/projets/${path}`;
  if (slug === 'actualites') return `/actualites/${path}`;
  return null;
}

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource: slug, id } = await params;

  const resource = findResource(slug);
  if (!resource) notFound();

  const user = await currentUser();
  if (!user) return null;

  if (!canWrite(resource, user)) {
    return (
      <>
        <AdminHeader title={resource.label} />
        <EmptyState title="Modification non autorisée" body="Contactez l’administrateur du site." />
      </>
    );
  }

  // Les collections sont courtes : on lit la liste d'administration et on y
  // retrouve l'élément, plutôt que d'ajouter une route par ressource.
  const rows = await adminFetch<Row[]>(resource.paths.list);
  const record = rows.find((row) => String(row.id) === id);
  if (!record) notFound();

  const dynamicOptions = await loadDynamicOptions(resource.fields);
  const lockedFields = user.role === 'CONTRIBUTOR' ? ['isPublished', 'isFeatured'] : [];
  const url = publicUrl(slug, record);
  const title = String(record.title ?? record.name ?? resource.labelOne);

  return (
    <>
      <Link
        href={`/admin/${resource.slug}`}
        className="link-sweep mb-6 inline-flex items-center gap-2 text-[0.875rem] font-medium text-muted"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {resource.label}
      </Link>

      <AdminHeader
        title={title}
        actions={
          url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 font-display text-[0.875rem] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-paper"
            >
              Voir sur le site
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : undefined
        }
      />

      <Panel>
        <ResourceForm
          resource={resource}
          record={record}
          dynamicOptions={dynamicOptions}
          lockedFields={lockedFields}
        />
      </Panel>

      {/* Les données d'impact ne relèvent pas du formulaire générique : elles
          forment une collection à part, et le cahier des charges les classe en
          contenu sensible (niveau 3). */}
      {slug === 'projets' && (
        <ImpactPanel
          projectId={id}
          impacts={record.impacts ?? []}
          canEdit={user.role === 'ADMIN'}
        />
      )}
    </>
  );
}
