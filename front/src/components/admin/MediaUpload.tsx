'use client';

import { useActionState, useState } from 'react';
import { Upload } from 'lucide-react';
import { uploadMedia, type ActionResult } from '@/app/admin/actions';
import { SelectField, TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';
import { Panel } from './ui';

const BUCKETS = [
  { value: 'FIELD', label: 'Terrain' },
  { value: 'PROGRAMS', label: 'Programmes' },
  { value: 'PROJECTS', label: 'Projets' },
  { value: 'NEWS', label: 'Actualités' },
  { value: 'TESTIMONIALS', label: 'Témoignages' },
  { value: 'PARTNERS', label: 'Partenaires' },
  { value: 'BRAND', label: 'Brand Kit' },
  { value: 'DOCUMENTS', label: 'Documents' },
];

/**
 * Dépôt d'un média.
 *
 * Le formulaire ne demande à l'envoi que le strict nécessaire : le fichier,
 * son rangement et sa description. Les métadonnées de droits se renseignent
 * ensuite sur la fiche — un média déposé sans consentement n'est de toute
 * façon pas publiable, l'API le refusera.
 */
export function MediaUpload() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    uploadMedia,
    null,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 font-display text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-gold-deep active:scale-[0.98]"
      >
        <Upload className="size-4" strokeWidth={2.5} aria-hidden />
        Déposer un média
      </button>
    );
  }

  return (
    <Panel>
      <h2 className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
        Déposer un média
      </h2>

      <form action={action} className="mt-4 space-y-4">
        <FormStatus
          state={state ? (state.ok ? 'success' : 'error') : 'idle'}
          message={state?.message}
        />

        <div>
          <label htmlFor="media-file" className="mb-2 block text-sm font-medium text-ink">
            Fichier
          </label>
          <input
            id="media-file"
            name="file"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,application/pdf"
            className="w-full rounded-card border border-ink/15 bg-paper px-4 py-3 text-[0.875rem] text-ink file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-display file:text-[0.8125rem] file:font-semibold file:text-paper hover:border-ink/30"
          />
          <p className="mt-1.5 text-[0.8125rem] text-muted">25 Mo au maximum.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SelectField id="media-bucket" name="bucket" label="Rangement" defaultValue="FIELD">
            {BUCKETS.map((bucket) => (
              <option key={bucket.value} value={bucket.value}>
                {bucket.label}
              </option>
            ))}
          </SelectField>

          <TextField
            id="media-alt"
            name="altText"
            label="Description (texte alternatif)"
            hideLabel={false}
          />

          <TextField id="media-credit" name="credit" label="Crédit" hideLabel={false} />

          <TextField
            id="media-captured"
            name="capturedAt"
            type="date"
            label="Date de captation"
            hideLabel={false}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
          <ActionButton type="submit" variant="dark" disabled={pending}>
            {pending ? 'Envoi…' : 'Déposer'}
          </ActionButton>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-ink/15 px-5 py-3 font-display text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-mist"
          >
            Fermer
          </button>
        </div>

      </form>
    </Panel>
  );
}
