import type { JournalEntry } from '@/lib/admin/dashboard';

/**
 * Date en clair, relative pour les dernières heures.
 *
 * « Il y a 2 h » situe mieux qu'une date pour ce qui vient d'arriver, et une
 * date situe mieux que « il y a 9 jours » pour ce qui est plus ancien.
 */
function quand(iso: string): string {
  const date = new Date(iso);
  const heures = (Date.now() - date.getTime()) / 3_600_000;

  if (heures < 1) return 'à l’instant';
  if (heures < 24) return `il y a ${Math.round(heures)} h`;
  if (heures < 48) return 'hier';

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

/** Journal d'activité du back-office. */
export function Journal({ entries }: { entries: JournalEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="px-5 py-8 text-[0.875rem] text-muted">
        Rien à signaler pour le moment. Les dons, demandes et publications
        apparaîtront ici.
      </p>
    );
  }

  return (
    <ol className="min-h-0 flex-1 overflow-y-auto">
      {entries.map((entree, index) => (
        <li
          key={`${entree.at}-${index}`}
          className="border-b border-ink/8 px-5 py-4 last:border-0"
        >
          <p className="text-[0.75rem] text-muted">
            <time dateTime={entree.at}>{quand(entree.at)}</time>
          </p>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink">{entree.text}</p>

          {entree.pending && (
            <p className="mt-2.5 inline-flex rounded-full bg-gold/25 px-2.5 py-1 text-[0.6875rem] font-semibold text-ink">
              À confirmer
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
