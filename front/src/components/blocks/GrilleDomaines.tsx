import Link from 'next/link';
import type { Domain } from '@/lib/types';
import { SdgBadges } from '@/components/blocks/SdgBadges';

/**
 * Les quatre domaines, à plat.
 *
 * Remplace la liste dépliable : tout est lisible d'emblée — ce que le domaine
 * recouvre, les objectifs auxquels il contribue, et les programmes qui le
 * composent. L'ancienne version demandait un clic par domaine pour obtenir la
 * même chose, et deux filtres par-dessus.
 *
 * Chaque programme reste un lien : c'est par là qu'on atteint sa fiche, et
 * c'est ce que vérifie la suite de tests. Une simple liste de texte aurait
 * rendu les huit fiches inatteignables depuis cette page.
 */
export function GrilleDomaines({ domains }: { domains: Domain[] }) {
  return (
    <ul className="space-y-4">
      {domains.map((domaine) => {
        const programmes = domaine.programs ?? [];

        return (
          <li
            key={domaine.id}
            id={domaine.slug}
            className="scroll-mt-28 rounded-card border border-ink/10 bg-paper p-6 transition-colors duration-300 hover:border-gold/45 md:p-7"
          >
            <div className="grid gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)_minmax(0,1fr)] md:gap-8">
              {/* ── Le domaine ── */}
              <div>
                <h3 className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                  {domaine.name}
                </h3>
                <p className="mt-1.5 text-[0.8125rem] font-semibold text-gold-deep">
                  {programmes.length} programme{programmes.length > 1 ? 's' : ''}
                </p>
              </div>

              {/* ── Ce qu'il recouvre ── */}
              <div>
                <p className="text-[0.875rem] leading-relaxed text-muted">
                  {domaine.description}
                </p>
                {domaine.sdgs.length > 0 && (
                  <SdgBadges sdgs={domaine.sdgs} libelle="ODD" className="mt-4" />
                )}
              </div>

              {/* ── Les programmes qui le composent ── */}
              {programmes.length > 0 && (
                <div>
                  <p className="text-[0.6875rem] font-bold tracking-wide text-muted uppercase">
                    Sous-programmes
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {programmes.map((programme) => (
                      <li key={programme.id}>
                        <Link
                          href={`/programmes/${programme.slug}`}
                          className="link-tap group flex items-start gap-2 text-[0.875rem] text-ink/80 transition-colors hover:text-ink"
                        >
                          <span
                            className="mt-[0.5rem] size-1.5 shrink-0 rounded-full bg-gold"
                            aria-hidden
                          />
                          <span className="link-sweep">{programme.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
