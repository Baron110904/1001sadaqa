import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { currentUser } from '@/lib/admin/client';
import { canWrite, findResource } from '@/lib/admin/resources';
import { loadDynamicOptions } from '@/lib/admin/options';
import { AdminHeader, EmptyState, Panel } from '@/components/admin/ui';
import { ResourceForm } from '@/components/admin/ResourceForm';

export default async function CreateResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: slug } = await params;

  const resource = findResource(slug);
  if (!resource) notFound();

  const user = await currentUser();
  if (!user) return null;

  if (!canWrite(resource, user)) {
    return (
      <>
        <AdminHeader title={resource.label} />
        <EmptyState title="Création non autorisée" body="Contactez l’administrateur du site." />
      </>
    );
  }

  const dynamicOptions = await loadDynamicOptions(resource.fields);

  // Un contributeur rédige et enregistre, mais ne publie pas : le champ est
  // présenté verrouillé plutôt que masqué, pour que la règle soit lisible.
  const lockedFields = user.role === 'CONTRIBUTOR' ? ['isPublished', 'isFeatured'] : [];

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
        title={`${resource.feminine ? 'Nouvelle' : 'Nouveau'} ${resource.labelOne}`}
      />

      <Panel>
        <ResourceForm
          resource={resource}
          dynamicOptions={dynamicOptions}
          lockedFields={lockedFields}
        />
      </Panel>
    </>
  );
}
