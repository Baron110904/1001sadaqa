import { adminFetch, currentUser } from '@/lib/admin/client';
import { AdminHeader, Badge, EmptyState, Panel } from '@/components/admin/ui';
import { MediaCard } from '@/components/admin/MediaCard';
import { MediaUpload } from '@/components/admin/MediaUpload';

export interface MediaAsset {
  id: string;
  bucket: string;
  url: string;
  mimeType: string;
  altText: string | null;
  credit: string | null;
  capturedAt: string | null;
  consentStatus: 'MISSING' | 'PENDING' | 'GRANTED' | 'REFUSED' | 'EXPIRED';
  consentKind: string | null;
  consentScopes: string[];
  consentSignedBy: string | null;
  consentIsGuardian: boolean;
  consentSignedAt: string | null;
  consentExpiresAt: string | null;
  consentNotes: string | null;
  showInGallery: boolean;
}

/**
 * Media Library.
 *
 * L'écran est organisé autour du droit à l'image, parce que c'est là que se
 * joue le point de vigilance du cahier des charges : les médias sans
 * consentement valide remontent en tête, et la mise en galerie est refusée par
 * l'API tant que l'autorisation n'est pas accordée pour l'usage web.
 */
export default async function MediaPage() {
  const user = await currentUser();
  if (!user) return null;

  const assets = await adminFetch<MediaAsset[]>('/media');
  const canEditRights = user.role === 'ADMIN' || user.role === 'EDITOR';

  const incomplete = assets.filter((asset) => asset.consentStatus !== 'GRANTED');
  const complete = assets.filter((asset) => asset.consentStatus === 'GRANTED');

  return (
    <>
      <AdminHeader title="Media Library" />

      <MediaUpload />

      {assets.length === 0 ? (
        <EmptyState
          title="Aucun média"
          body="Déposez un premier fichier avec ses métadonnées de droits."
        />
      ) : (
        <>
          {incomplete.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-3 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                Droits à compléter
                <Badge tone="wait">{incomplete.length}</Badge>
              </h2>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {incomplete.map((asset) => (
                  <MediaCard key={asset.id} asset={asset} canEdit={canEditRights} />
                ))}
              </div>
            </section>
          )}

          {complete.length > 0 && (
            <section className="mt-10">
              <h2 className="flex items-center gap-3 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                Droits en règle
                <Badge tone="ok">{complete.length}</Badge>
              </h2>

              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {complete.map((asset) => (
                  <MediaCard key={asset.id} asset={asset} canEdit={canEditRights} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
