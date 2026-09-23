import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { InputHTMLAttributes } from 'react';

const CONTROL =
  'w-full rounded-card border bg-paper px-4 py-3.5 text-[0.9375rem] text-ink transition-all duration-200 outline-none placeholder:text-muted/70 focus:border-gold focus:ring-4 focus:ring-gold/18 disabled:opacity-60';

const TONES = {
  light: 'border-ink/15 hover:border-ink/30',
  dark: 'border-paper/20 bg-paper/5 text-paper placeholder:text-paper/45 hover:border-paper/40',
} as const;

type Tone = keyof typeof TONES;

interface Common {
  label: string;
  /** Le libellé sert de placeholder ; il reste lisible par les lecteurs d'écran. */
  hideLabel?: boolean;
  error?: string;
  tone?: Tone;
  className?: string;
}

function Wrapper({
  label,
  hideLabel,
  error,
  id,
  className,
  children,
}: Common & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-2 block text-sm font-medium text-ink'}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  hideLabel = true,
  error,
  tone = 'light',
  className,
  id,
  ...props
}: Common & InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  return (
    <Wrapper label={label} hideLabel={hideLabel} error={error} id={id} className={className}>
      <input
        id={id}
        placeholder={hideLabel ? label : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} ${TONES[tone]} ${error ? 'border-red-600' : ''}`}
        {...props}
      />
    </Wrapper>
  );
}

export function TextAreaField({
  label,
  hideLabel = true,
  error,
  tone = 'light',
  className,
  id,
  rows = 5,
  ...props
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string }) {
  return (
    <Wrapper label={label} hideLabel={hideLabel} error={error} id={id} className={className}>
      <textarea
        id={id}
        rows={rows}
        placeholder={hideLabel ? label : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} ${TONES[tone]} resize-y ${error ? 'border-red-600' : ''}`}
        {...props}
      />
    </Wrapper>
  );
}

export function SelectField({
  label,
  hideLabel = false,
  error,
  tone = 'light',
  className,
  id,
  children,
  ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { id: string; children: ReactNode }) {
  return (
    <Wrapper label={label} hideLabel={hideLabel} error={error} id={id} className={className}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} ${TONES[tone]} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2355625a%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:18px] bg-[position:right_1rem_center] bg-no-repeat pr-11 ${
          error ? 'border-red-600' : ''
        }`}
        {...props}
      >
        {children}
      </select>
    </Wrapper>
  );
}
