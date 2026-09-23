import { notFound } from 'next/navigation';
import { findResource } from '@/lib/admin/resources';
import { ResourceTable } from '@/components/admin/ResourceTable';

/**
 * Liste d'un contenu.
 *
 * La page ne fait plus que résoudre le descripteur : la lecture, le rendu du
 * tableau et la suppression vivent dans le navigateur. C'est ce qui rend le
 * changement de rubrique immédiat — auparavant chaque clic relançait un rendu
 * serveur complet, avec sa vérification de session et sa lecture d'API.
 *
 * Le descripteur traverse la frontière serveur/client : il ne contient que des
 * données, aucune fonction, faute de quoi React refuserait de le sérialiser.
 */
export default async function ResourceListPage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: slug } = await params;

  const resource = findResource(slug);
  if (!resource) notFound();

  return <ResourceTable resource={resource} />;
}
