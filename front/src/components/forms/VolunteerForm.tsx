'use client';

import { useActionState } from 'react';
import { text } from '@/lib/text';
import { sendVolunteer } from '@/app/actions';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';
import type { SubmitResult } from '@/lib/api';
import type { VolunteerMission } from '@/lib/types';

/**
 * Candidature bénévole.
 *
 * La maquette ne prévoit pas de champ e-mail ; il est ajouté ici parce que le
 * modèle de données le rend obligatoire et que c'est le seul moyen fiable de
 * répondre à une candidature. Le champ « mission souhaitée » est une liste
 * alimentée par les missions ouvertes, plutôt qu'un texte libre : la
 * candidature arrive rattachée à une mission identifiée en base.
 */
export function VolunteerForm({ missions }: { missions: VolunteerMission[] }) {
  const t = text('volunteer.form');
  const tCommon = text('common');
  const [state, action, pending] = useActionState<SubmitResult | null, FormData>(
    sendVolunteer,
    null,
  );

  const success = state?.ok === true;

  return (
    <form action={action} className="space-y-4">
      <FormStatus
        state={state ? (success ? 'success' : 'error') : 'idle'}
        message={success ? t('success') : state?.message}
      />

      {!success && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="vol-name" name="name" label={t('name')} autoComplete="name" required minLength={2} />
            <TextField
              id="vol-phone"
              name="phone"
              type="tel"
              label={t('phone')}
              autoComplete="tel"
              required
              minLength={6}
            />
          </div>

          <TextField
            id="vol-email"
            name="email"
            type="email"
            label={t('email')}
            autoComplete="email"
            required
          />

          {missions.length > 0 && (
            <SelectField id="vol-mission" name="missionId" label={t('mission')} defaultValue="">
              <option value="">{t('missionAny')}</option>
              {missions.map((mission) => (
                <option key={mission.id} value={mission.id}>
                  {mission.title}
                </option>
              ))}
            </SelectField>
          )}

          <TextAreaField
            id="vol-availability"
            name="availability"
            label={t('availability')}
            rows={4}
          />

          <ActionButton type="submit" variant="dark" disabled={pending} withArrow={!pending}>
            {pending ? tCommon('sending') : t('submit')}
          </ActionButton>
        </>
      )}
    </form>
  );
}
