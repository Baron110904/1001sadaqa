import Link from 'next/link';
import { ArrowRight, CalendarClock, EyeOff } from 'lucide-react';
import { adminFetch, currentUser } from '@/lib/admin/client';
import type { DashboardOverview } from '@/lib/admin/dashboard';
import { Panel } from '@/components/admin/ui';
import { DonationChart } from '@/components/admin/DonationChart';
import { Journal } from '@/components/admin/Journal';
import { formatXof } from '@/lib/format';

/** Libellé de période d'un événement, sans répéter le mois inutilement. */
function periode(debut: string, fin: string | null): string {
  const d = new Date(debut);
  const f = fin ? new Date(fin) : null;
  const mois = new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' });
  const complet = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  if (!f || d.getTime() === f.getTime()) return complet.format(d);

  const memeMois = d.getUTCMonth() === f.getUTCMonth() && d.getUTCFullYear() === f.getUTCFullYear();
  return memeMois
    ? `${d.getUTCDate()} - ${f.getUTCDate()} ${mois.format(d)} ${f.getUTCFullYear()}`
    : `${complet.format(d)} - ${complet.format(f)}`;
}

/**
 * Tableau de bord.
 *
 * Il répond dans cet ordre : qu'est-ce qui attend une action, quels volumes de
 * contenu, où en est la collecte, et que s'est-il passé récemment. La colonne
 * de droite porte le journal et la prochaine échéance — du contexte, pas des
 * tâches.
 */
export default async function AdminDashboard() {
  const [user, overview] = await Promise.all([
    currentUser(),
    adminFetch<DashboardOverview>('/dashboard').catch(() => null),
  ]);

  if (!user) return null;

  if (!overview) {
    return (
      <Panel>
        <p className="font-display text-[0.9375rem] font-bold text-ink">
          Le tableau de bord n’a pas pu être chargé
        </p>
        <p className="mt-2 text-[0.875rem] text-muted">
          Rechargez la page. Si le problème persiste, l’API est peut-être arrêtée.
        </p>
      </Panel>
    );
  }

  const { pending, counts, donations, journal, nextEvent } = overview;

  // Tout ce qui attend une action, toutes natures confondues. Les dons ne
  // comptent que si le rôle y a accès.
  const aTraiter =
    (pending.donations ?? 0) +
    pending.partnerships +
    pending.contacts +
    pending.volunteers +
    pending.members +
    pending.mediaConsent;

  /** Les deux files les plus urgentes, mises en avant. */
  const files = [
    pending.donations !== null && {
      label: 'Dons à confirmer',
      valeur: pending.donations,
      href: '/admin/demandes?onglet=dons',
      action: 'Traiter',
      accent: true,
    },
    {
      label: 'Demandes de partenariat',
      valeur: pending.partnerships,
      href: '/admin/demandes?onglet=partenariats',
      action: 'Ouvrir',
      accent: false,
    },
    pending.contacts > 0 && {
      label: 'Messages non lus',
      valeur: pending.contacts,
      href: '/admin/demandes',
      action: 'Lire',
      accent: false,
    },
    pending.mediaConsent > 0 && {
      label: 'Médias sans consentement',
      valeur: pending.mediaConsent,
      href: '/admin/medias',
      action: 'Vérifier',
      accent: false,
    },
  ].filter(Boolean) as {
    label: string;
    valeur: number;
    href: string;
    action: string;
    accent: boolean;
  }[];

  const tuiles = [
    { label: 'Programmes', valeur: counts.programs, href: '/admin/programmes' },
    { label: 'Projets', valeur: counts.projects, href: '/admin/projets' },
    { label: 'Actualités', valeur: counts.news, href: '/admin/actualites' },
    { label: 'Médias à valider', valeur: counts.mediaToValidate, href: '/admin/medias' },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem] xl:gap-8">
      {/* ── Colonne principale ─────────────────────────────────────────── */}
      <div>
        <h1 className="font-display text-title font-bold tracking-tight text-ink">
          Bonjour {user.name.split(' ')[0]}
        </h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          {aTraiter === 0
            ? 'Rien n’attend d’action. Tout est à jour.'
            : `${aTraiter} élément${aTraiter > 1 ? 's' : ''} attend${
                aTraiter > 1 ? 'ent' : ''
              } une action. Tout le reste est à jour.`}
        </p>

        {/* ── Files d'attente ──────────────────────────────────────────── */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {files.map((file) => (
            <div
              key={file.label}
              className={`flex items-center justify-between gap-4 rounded-card border p-6 ${
                file.accent && file.valeur > 0
                  ? 'border-transparent bg-ink'
                  : 'border-ink/10 bg-paper'
              }`}
            >
              <span>
                <span
                  className={`block text-[0.9375rem] ${
                    file.accent && file.valeur > 0 ? 'text-paper/70' : 'text-muted'
                  }`}
                >
                  {file.label}
                </span>
                <span
                  className={`mt-1 block font-display text-[2.5rem] leading-none font-bold tracking-tight tabular ${
                    file.accent && file.valeur > 0 ? 'text-paper' : 'text-ink'
                  }`}
                >
                  {file.valeur}
                </span>
              </span>

              <Link
                href={file.href}
                className={`shrink-0 rounded-full px-5 py-3 font-display text-[0.875rem] font-semibold transition-colors ${
                  file.accent && file.valeur > 0
                    ? 'bg-gold text-ink hover:bg-gold-deep'
                    : 'border border-ink/15 text-ink hover:border-ink/40 hover:bg-mist'
                }`}
              >
                {file.action}
                <span className="sr-only"> - {file.label}</span>
              </Link>
            </div>
          ))}
        </section>

        {/* ── Volumes de contenu ───────────────────────────────────────── */}
        <section className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tuiles.map((tuile) => (
            <Link
              key={tuile.label}
              href={tuile.href}
              className="group rounded-card border border-ink/10 bg-paper p-6 transition-all duration-300 hover:border-gold/45 hover:shadow-soft"
            >
              <span
                className={`block font-display text-[2rem] leading-none font-bold tracking-tight tabular ${
                  tuile.valeur === 0 ? 'text-ink/30' : 'text-ink'
                }`}
              >
                {tuile.valeur}
              </span>
              <span className="mt-2 block text-[0.875rem] text-muted">{tuile.label}</span>
            </Link>
          ))}
        </section>

        {/* ── Collecte de dons ─────────────────────────────────────────── */}
        {donations && (
          <Panel className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                Collecte de dons
              </h2>
              <Link
                href="/admin/demandes?onglet=dons"
                className="link-sweep link-tap inline-flex items-center gap-1.5 font-display text-[0.875rem] font-semibold text-leaf"
              >
                Voir le détail
                <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-12 gap-y-5">
              <p>
                <span className="block font-display text-[2rem] leading-none font-bold tracking-tight text-ink tabular">
                  {formatXof(donations.collectedTotal)}
                </span>
                <span className="mt-2 block text-[0.8125rem] text-muted">encaissés</span>
              </p>
              <p>
                <span className="block font-display text-[2rem] leading-none font-bold tracking-tight text-ink tabular">
                  {donations.completedCount}
                </span>
                <span className="mt-2 block text-[0.8125rem] text-muted">dons confirmés</span>
              </p>
              <p>
                <span className="block font-display text-[2rem] leading-none font-bold tracking-tight text-gold-deep tabular">
                  {donations.pendingCount}
                </span>
                <span className="mt-2 block text-[0.8125rem] text-muted">en attente</span>
              </p>
            </div>

            <DonationChart monthly={donations.monthly} className="mt-8" />
          </Panel>
        )}
      </div>

      {/* ── Colonne de contexte ────────────────────────────────────────── */}
      {/* Sur grand écran, la colonne tient la hauteur de la fenêtre et suit le
          défilement : le journal défile à l'intérieur, et la carte d'échéance
          reste visible en bas. Sans cela le journal poussait l'échéance sous
          la ligne de flottaison, où plus personne ne la voyait. */}
      <aside className="flex flex-col gap-4 xl:sticky xl:top-10 xl:h-[calc(100dvh-5rem)]">
        <Panel className="flex min-h-0 flex-1 flex-col p-0 md:p-0">
          <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
            <h2 className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
              Journal
            </h2>
            <Link
              href="/admin/demandes"
              className="link-sweep link-tap font-display text-[0.8125rem] font-semibold text-leaf"
            >
              Tout
            </Link>
          </div>

          <Journal entries={journal} />
        </Panel>

        {nextEvent && (
          <div className="rounded-card bg-ink p-5">
            <p className="eyebrow flex items-center gap-2 text-gold">
              <CalendarClock className="size-3.5" aria-hidden />
              Échéance
            </p>
            <p className="mt-3 font-display text-[1.0625rem] font-bold tracking-tight text-paper">
              {nextEvent.title}
            </p>
            <p className="mt-1.5 text-[0.8125rem] text-paper/60">
              {nextEvent.location} · {periode(nextEvent.startDate, nextEvent.endDate)}
            </p>

            {/* Un événement encore masqué reste une échéance interne : on le
                signale au lieu de le taire. */}
            {!nextEvent.isPublished && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-paper/12 px-2.5 py-1 text-[0.75rem] font-medium text-paper/80">
                <EyeOff className="size-3.5" aria-hidden />
                Pas encore publié
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
