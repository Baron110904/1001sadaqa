import type { ReactNode } from 'react';

/** En-tête de page du back-office : titre, phrase d'aide, actions à droite. */
export function AdminHeader({
  title,
  hint,
  actions,
}: {
  title: string;
  hint?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[1.75rem]">
          {title}
        </h1>
        {hint && <p className="mt-1.5 max-w-2xl text-[0.875rem] text-muted">{hint}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </header>
  );
}

/** Cadre blanc, unité de base des écrans d'administration. */
export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-panel border border-ink/10 bg-paper p-5 md:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

/** Pastille d'état. Le ton porte le sens : vert accompli, or en attente. */
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'ok' | 'wait' | 'off';
}) {
  const tones = {
    neutral: 'bg-fog text-ink',
    ok: 'bg-leaf/12 text-leaf',
    wait: 'bg-gold/18 text-gold-deep',
    off: 'bg-ink/8 text-muted',
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-display text-[0.6875rem] font-bold tracking-wide whitespace-nowrap uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Message affiché lorsqu'une liste est vide, avec l'action qui s'impose. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-panel border border-dashed border-ink/20 bg-mist px-6 py-12 text-center">
      <p className="font-display text-[1.0625rem] font-bold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[0.875rem] text-muted">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

