/**
 * Écran d'attente du back-office.
 *
 * Chaque page est rendue sur le serveur : sans cet état, un clic dans le menu
 * ne produit rien à l'écran le temps de la réponse, et l'interface paraît
 * bloquée. La silhouette s'affiche immédiatement et reprend la mise en page
 * qui va la remplacer.
 */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Chargement…</span>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <span className="block h-9 w-64 rounded-lg bg-ink/8" />
        <span className="block h-12 w-48 rounded-full bg-ink/8" />
      </div>

      <div className="rounded-card border border-ink/10 bg-paper p-4 md:p-6">
        <span className="mb-4 block h-10 rounded-lg bg-mist" />
        {[0, 1, 2, 3, 4].map((row) => (
          <span
            key={row}
            className="mb-3 block h-11 rounded-lg bg-ink/5 last:mb-0"
            style={{ opacity: 1 - row * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
