'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { saveResource, type ActionResult } from '@/app/admin/actions';
import type { FieldDef, MediaBucket, ResourceDef } from '@/lib/admin/resources';
import { FileField } from '@/components/admin/FileField';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { ActionButton } from '@/components/ui/Button';
import { FormStatus } from '@/components/ui/FormStatus';

type Record_ = Record<string, unknown>;

interface ResourceFormProps {
  resource: ResourceDef;
  /** Valeurs existantes en modification, vide en création. */
  record?: Record_;
  /** Options chargées depuis l'API pour les champs qui en dépendent. */
  dynamicOptions: Record<string, { value: string; label: string }[]>;
  /** Champs verrouillés faute de droits suffisants. */
  lockedFields?: string[];
}

/** Valeur initiale d'un champ, mise au format attendu par son contrôle. */
function initialValue(field: FieldDef, record?: Record_): string {
  const raw = record?.[field.name];
  if (raw === null || raw === undefined) {
    return !record && field.defaultOn ? 'true' : '';
  }

  if (field.type === 'list') {
    return Array.isArray(raw) ? raw.join('\n') : String(raw);
  }

  if (field.type === 'numbers') {
    return Array.isArray(raw) ? raw.join(', ') : String(raw);
  }

  if (field.type === 'date') {
    // <input type="date"> attend AAAA-MM-JJ.
    const date = new Date(String(raw));
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }

  return String(raw);
}

/**
 * Formulaire de contenu, engendré depuis le descripteur de la ressource.
 *
 * Un seul écran sert les neuf types de contenu. Les champs déclarés `wide`
 * occupent toute la largeur ; les autres se rangent sur deux colonnes.
 */
export function ResourceForm({
  resource,
  record,
  dynamicOptions,
  lockedFields = [],
}: ResourceFormProps) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    saveResource,
    null,
  );

  const id = record?.id ? String(record.id) : '';

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="__resource" value={resource.slug} />
      {id && <input type="hidden" name="__id" value={id} />}

      <FormStatus state={state && !state.ok ? 'error' : 'idle'} message={state?.message} />

      <div className="grid gap-5 md:grid-cols-2">
        {resource.fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            value={initialValue(field, record)}
            options={field.optionsFrom ? dynamicOptions[field.optionsFrom] : field.options}
            bucket={resource.bucket}
            locked={lockedFields.includes(field.name)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
        <ActionButton type="submit" variant="dark" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </ActionButton>

        <Link
          href={`/admin/${resource.slug}`}
          className="rounded-full border border-ink/15 px-5 py-3 font-display text-[0.9375rem] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-mist"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}

function Field({
  field,
  value,
  options,
  bucket,
  locked,
}: {
  field: FieldDef;
  value: string;
  options?: { value: string; label: string }[];
  bucket: MediaBucket;
  locked: boolean;
}) {
  const id = `champ-${field.name}`;
  const span = field.wide ? 'md:col-span-2' : '';

  if (field.type === 'boolean') {
    return (
      <div className={span}>
        <label
          htmlFor={id}
          className={`flex items-start gap-3 rounded-card border border-ink/10 bg-mist px-4 py-3.5 ${
            locked ? 'opacity-55' : 'cursor-pointer hover:border-ink/25'
          }`}
        >
          <input
            id={id}
            name={field.name}
            type="checkbox"
            defaultChecked={value === 'true'}
            disabled={locked}
            className="mt-0.5 size-4 shrink-0 accent-[#0B2E15]"
          />
          <span>
            <span className="block text-[0.9375rem] font-medium text-ink">{field.label}</span>
            {(field.help || locked) && (
              <span className="mt-0.5 block text-[0.8125rem] text-muted">
                {locked ? 'Votre rôle ne permet pas de modifier ce réglage.' : field.help}
              </span>
            )}
          </span>
        </label>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className={span}>
        <SelectField
          id={id}
          name={field.name}
          label={field.label}
          defaultValue={value}
          required={field.required}
          disabled={locked}
        >
          {!field.required && <option value=""> - Aucun - </option>}
          {(options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        {field.help && <p className="mt-1.5 text-[0.8125rem] text-muted">{field.help}</p>}
      </div>
    );
  }

  /**
   * Liste de lignes : une entrée par ligne saisie.
   *
   * Les activités d'un programme et les chiffres d'un événement sont des
   * tableaux côté API. Les faire saisir ligne par ligne évite la ponctuation
   * de séparation, que chacun écrirait autrement.
   */
  if (field.type === 'list') {
    return (
      <div className={span}>
        <TextAreaField
          id={id}
          name={field.name}
          label={field.label}
          hideLabel={false}
          defaultValue={value}
          required={field.required}
          disabled={locked}
          rows={5}
        />
        <p className="mt-1.5 text-[0.8125rem] text-muted">
          {field.help ?? 'Une entrée par ligne.'}
        </p>
      </div>
    );
  }

  if (field.type === 'numbers') {
    return (
      <div className={span}>
        <TextField
          id={id}
          name={field.name}
          type="text"
          label={field.label}
          hideLabel={false}
          defaultValue={value}
          disabled={locked}
          placeholder="1, 3, 4, 10"
          inputMode="numeric"
        />
        {field.help && <p className="mt-1.5 text-[0.8125rem] text-muted">{field.help}</p>}
      </div>
    );
  }

  if (field.type === 'textarea' || field.type === 'richtext') {
    return (
      <div className={span}>
        <TextAreaField
          id={id}
          name={field.name}
          label={field.label}
          hideLabel={false}
          defaultValue={value}
          required={field.required}
          disabled={locked}
          rows={field.type === 'richtext' ? 10 : 3}
        />
        {field.help && <p className="mt-1.5 text-[0.8125rem] text-muted">{field.help}</p>}
      </div>
    );
  }

  if (field.type === 'image' || field.type === 'file') {
    return (
      <div className={span}>
        <FileField
          id={id}
          name={field.name}
          label={field.label}
          value={value}
          bucket={bucket}
          variant={field.type === 'file' ? 'document' : 'image'}
          required={field.required}
          disabled={locked}
        />
      </div>
    );
  }

  const inputType =
    field.type === 'number' || field.type === 'money'
      ? 'number'
      : field.type === 'date'
        ? 'date'
        : 'text';

  return (
    <div className={span}>
      <TextField
        id={id}
        name={field.name}
        type={inputType}
        label={field.label}
        hideLabel={false}
        defaultValue={value}
        required={field.required}
        disabled={locked}
        placeholder={field.placeholder}
        min={field.min}
        step={field.type === 'money' ? 500 : undefined}
        className={field.type === 'money' || field.type === 'number' ? 'max-w-xs' : undefined}
      />
      {field.help && <p className="mt-1.5 text-[0.8125rem] text-muted">{field.help}</p>}
    </div>
  );
}
