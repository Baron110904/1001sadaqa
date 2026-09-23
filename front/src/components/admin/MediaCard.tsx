'use client';

import Image from 'next/image';
import { useActionState, useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { deleteMedia, updateMedia, type ActionResult } from '@/app/admin/actions';
import type { MediaAsset } from '@/app/admin/medias/page';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';
import { Badge, Panel } from './ui';

const CONSENT_STATUS = [
  { value: 'MISSING', label: 'Absent' },
  { value: 'PENDING', label: 'En cours de recueil' },
  { value: 'GRANTED', label: 'Accordé' },
  { value: 'REFUSED', label: 'Refusé' },
  { value: 'EXPIRED', label: 'Expiré' },
];

const CONSENT_KIND = [
  { value: 'WRITTEN', label: 'Autorisation écrite' },
  { value: 'RECORDED_ORAL', label: 'Accord oral enregistré' },
  { value: 'NOT_REQUIRED', label: 'Non requis (aucune personne identifiable)' },
];

const SCOPES = [
  { value: 'WEB', label: 'Site web' },
  { value: 'PRESS', label: 'Presse' },
  { value: 'SOCIAL', label: 'Réseaux sociaux' },
  { value: 'PRINT', label: 'Imprimé' },
];

const STATUS_TONE: Record<MediaAsset['consentStatus'], 'ok' | 'wait' | 'off'> = {
  GRANTED: 'ok',
  PENDING: 'wait',
  MISSING: 'off',
  REFUSED: 'off',
  EXPIRED: 'off',
};

function dateValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

/** Fiche d'un média : aperçu, état des droits, et formulaire dépliable. */
export function MediaCard({ asset, canEdit }: { asset: MediaAsset; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    updateMedia,
    null,
  );

  const isImage = asset.mimeType.startsWith('image/');
  const statusLabel =
    CONSENT_STATUS.find((option) => option.value === asset.consentStatus)?.label ??
    asset.consentStatus;

  return (
    <Panel>
      <div className="flex items-start gap-4">
        <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-card bg-sand">
          {isImage ? (
            <Image src={asset.url} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <FileText className="size-6 text-ink/30" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[0.9375rem] font-bold text-ink">
            {asset.altText || asset.url.split('/').pop()}
          </p>

          <p className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[asset.consentStatus]}>{statusLabel}</Badge>
            {asset.showInGallery && <Badge tone="ok">En galerie</Badge>}
            {asset.consentIsGuardian && <Badge tone="wait">Représentant légal</Badge>}
            <span className="text-[0.75rem] text-muted">{asset.bucket.toLowerCase()}</span>
          </p>

          {asset.consentScopes.length > 0 && (
            <p className="mt-2 text-[0.8125rem] text-muted">
              Portée : {asset.consentScopes.map((scope) => scope.toLowerCase()).join(', ')}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 font-display text-[0.8125rem] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-mist"
        >
          Droits
          <ChevronDown
            className={`size-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>

      {open && (
        <form action={action} className="mt-5 border-t border-ink/10 pt-5">
          <input type="hidden" name="__id" value={asset.id} />

          <FormStatus
            state={state ? (state.ok ? 'success' : 'error') : 'idle'}
            message={state?.message}
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextField
              id={`alt-${asset.id}`}
              name="altText"
              label="Description (texte alternatif)"
              hideLabel={false}
              defaultValue={asset.altText ?? ''}
              disabled={!canEdit}
            />
            <TextField
              id={`credit-${asset.id}`}
              name="credit"
              label="Crédit"
              hideLabel={false}
              defaultValue={asset.credit ?? ''}
              disabled={!canEdit}
            />

            <SelectField
              id={`status-${asset.id}`}
              name="consentStatus"
              label="État du consentement"
              defaultValue={asset.consentStatus}
              disabled={!canEdit}
            >
              {CONSENT_STATUS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>

            <SelectField
              id={`kind-${asset.id}`}
              name="consentKind"
              label="Nature de l’autorisation"
              defaultValue={asset.consentKind ?? ''}
              disabled={!canEdit}
            >
              <option value=""> - À préciser - </option>
              {CONSENT_KIND.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>

            <fieldset className="md:col-span-2">
              <legend className="mb-2 text-sm font-medium text-ink">Portée autorisée</legend>
              <div className="flex flex-wrap gap-4">
                {SCOPES.map((scope) => (
                  <label
                    key={scope.value}
                    className="flex cursor-pointer items-center gap-2 text-[0.875rem] text-ink"
                  >
                    <input
                      type="checkbox"
                      name="consentScopes"
                      value={scope.value}
                      defaultChecked={asset.consentScopes.includes(scope.value)}
                      disabled={!canEdit}
                      className="size-4 accent-[#0B2E15]"
                    />
                    {scope.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <TextField
              id={`signer-${asset.id}`}
              name="consentSignedBy"
              label="Signataire"
              hideLabel={false}
              defaultValue={asset.consentSignedBy ?? ''}
              disabled={!canEdit}
            />

            <div className="flex items-end">
              <label className="flex cursor-pointer items-start gap-2.5 rounded-card border border-ink/10 bg-mist px-4 py-3 text-[0.875rem] text-ink">
                <input
                  type="checkbox"
                  name="consentIsGuardian"
                  defaultChecked={asset.consentIsGuardian}
                  disabled={!canEdit}
                  className="mt-0.5 size-4 accent-[#0B2E15]"
                />
                Le signataire est le représentant légal d’une personne mineure
              </label>
            </div>

            <TextField
              id={`signed-${asset.id}`}
              name="consentSignedAt"
              type="date"
              label="Date de signature"
              hideLabel={false}
              defaultValue={dateValue(asset.consentSignedAt)}
              disabled={!canEdit}
            />
            <TextField
              id={`expires-${asset.id}`}
              name="consentExpiresAt"
              type="date"
              label="Fin de validité"
              hideLabel={false}
              defaultValue={dateValue(asset.consentExpiresAt)}
              disabled={!canEdit}
            />

            <TextField
              id={`captured-${asset.id}`}
              name="capturedAt"
              type="date"
              label="Date de captation"
              hideLabel={false}
              defaultValue={dateValue(asset.capturedAt)}
              disabled={!canEdit}
            />

            <div className="flex items-end">
              <label className="flex cursor-pointer items-start gap-2.5 rounded-card border border-ink/10 bg-mist px-4 py-3 text-[0.875rem] text-ink">
                <input
                  type="checkbox"
                  name="showInGallery"
                  defaultChecked={asset.showInGallery}
                  disabled={!canEdit}
                  className="mt-0.5 size-4 accent-[#0B2E15]"
                />
                Afficher dans la galerie du site
              </label>
            </div>

            <TextAreaField
              id={`notes-${asset.id}`}
              name="consentNotes"
              label="Notes"
              hideLabel={false}
              defaultValue={asset.consentNotes ?? ''}
              disabled={!canEdit}
              rows={2}
              className="md:col-span-2"
            />
          </div>

          {canEdit && (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-5">
              <ActionButton type="submit" variant="dark" size="sm" disabled={pending}>
                {pending ? 'Enregistrement…' : 'Enregistrer les droits'}
              </ActionButton>

              <span className="flex-1" />

              <MediaDelete />
            </div>
          )}
        </form>
      )}
    </Panel>
  );
}

/**
 * Suppression du média.
 *
 * Le bouton vit dans le formulaire des droits et redirige la soumission vers
 * une autre action grâce à `formAction` : imbriquer un second formulaire
 * serait du HTML invalide. Il réutilise donc le champ `__id` déjà présent.
 */
function MediaDelete() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-full border border-ink/15 px-4 py-2 font-display text-[0.8125rem] font-semibold text-muted transition-colors hover:border-red-600/40 hover:bg-red-50 hover:text-red-800"
      >
        Supprimer le média
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-[0.8125rem] text-muted">Supprimer définitivement ?</span>
      <button
        type="submit"
        formAction={deleteMedia}
        className="rounded-full bg-red-700 px-4 py-2 font-display text-[0.8125rem] font-semibold text-white hover:bg-red-800"
      >
        Oui, supprimer
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-full border border-ink/15 px-4 py-2 font-display text-[0.8125rem] font-semibold text-ink hover:bg-mist"
      >
        Non
      </button>
    </span>
  );
}
