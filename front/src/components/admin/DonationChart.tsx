import { formatXof } from '@/lib/format';

/**
 * Collecte mensuelle, en barres.
 *
 * Aucune bibliothèque de graphiques : six barres proportionnelles se font en
 * flexbox, et le rendu reste au serveur. Le tableau des valeurs est donné aux
 * lecteurs d'écran, pour lesquels une hauteur de barre ne veut rien dire.
 */
export function DonationChart({
  monthly,
  className = '',
}: {
  monthly: { month: string; total: number }[];
  className?: string;
}) {
  if (monthly.length === 0) return null;

  const maximum = Math.max(...monthly.map((point) => point.total));

  // Sans aucun don confirmé, six colonnes plates dans un cadre de deux cents
  // pixels donnent l'impression d'un graphique cassé. On le dit en une phrase.
  if (maximum === 0) {
    return (
      <p className={`rounded-card bg-mist px-5 py-8 text-center text-[0.875rem] text-muted ${className}`}>
        Aucun don confirmé sur les six derniers mois. Le graphique apparaîtra
        dès la première confirmation.
      </p>
    );
  }
  const mois = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' });
  const nomDe = (cle: string) => {
    const [annee, numero] = cle.split('-').map(Number);
    return mois.format(new Date(Date.UTC(annee, numero - 1, 1))).replace('.', '');
  };

  const dernier = monthly.length - 1;

  return (
    <figure className={className}>
      <div className="flex h-56 items-end gap-2 sm:gap-4" aria-hidden>
        {monthly.map((point, index) => (
          <div key={point.month} className="flex h-full flex-1 flex-col justify-end">
            {/* Un mois à zéro garde un filet de deux pixels : une colonne
                absente se confondrait avec une colonne manquante. */}
            <span
              className={`block w-full rounded-t-md ${
                index === dernier ? 'bg-gold' : 'bg-leaf/25'
              }`}
              style={{
                height: `${Math.max(2, Math.round((point.total / maximum) * 100))}%`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2 border-t border-ink/10 pt-3 sm:gap-4" aria-hidden>
        {monthly.map((point, index) => (
          <span
            key={point.month}
            className={`flex-1 text-center text-[0.75rem] capitalize ${
              index === dernier ? 'font-semibold text-ink' : 'text-muted'
            }`}
          >
            {nomDe(point.month)}
          </span>
        ))}
      </div>

      <figcaption className="sr-only">
        <table>
          <caption>Dons confirmés par mois</caption>
          <thead>
            <tr>
              <th scope="col">Mois</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((point) => (
              <tr key={point.month}>
                <th scope="row">{nomDe(point.month)}</th>
                <td>{formatXof(point.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
