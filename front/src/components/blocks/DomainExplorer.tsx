'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import type { Domain, Program } from '@/lib/types';
import { SdgBadges } from '@/components/blocks/SdgBadges';

/**
 * Les quatre domaines en cartes, chacune dépliable sur ses programmes (§4.2).
 *
 * Le parcours demandé tient en deux gestes : on choisit un domaine, on choisit
 * un programme — et le second clic mène directement à la fiche, sans écran de
 * résumé intermédiaire.
 *
 * Deux filtres, tous deux sur l'état de l'interface et non sur l'adresse : la
 * page reste indexable telle quelle, et revenir en arrière depuis une fiche ne
 * rejoue pas un rendu serveur.
 *
 * La liste des programmes d'un domaine est présente dans le HTML même quand la
 * carte est fermée : elle n'est que masquée. C'est ce qui permet au robot
 * d'indexation de suivre les huit liens, ce que le guide demande.
 */

const ETATS = {
  ACTIF: { label: 'Actif', classe: 'bg-leaf/10 text-leaf' },
  EN_PREPARATION: { label: 'En préparation', classe: 'bg-ink/8 text-muted' },
} as const;

type Etat = keyof typeof ETATS;

function Puce({ actif, onClick, children }: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={`rounded-full border px-4 py-2 font-display text-[0.8125rem] font-semibold transition-colors ${
        actif
          ? 'border-ink bg-ink text-paper'
          : 'border-ink/15 text-ink hover:border-ink/40 hover:bg-mist'
      }`}
    >
      {children}
    </button>
  );
}

function CarteDomaine({
  domain,
  programs,
  ouverte,
  onBascule,
}: {
  domain: Domain;
  programs: Program[];
  ouverte: boolean;
  onBascule: () => void;
}) {
  const panneau = `domaine-${domain.slug}`;

  return (
    <article
      id={domain.slug}
      className={`scroll-mt-28 overflow-hidden rounded-card border bg-paper transition-colors duration-300 ${
        ouverte ? 'border-gold/50 shadow-soft' : 'border-ink/10'
      }`}
    >
      <h3>
        <button
          type="button"
          onClick={onBascule}
          aria-expanded={ouverte}
          aria-controls={panneau}
          className="flex w-full items-start gap-4 p-6 text-left transition-colors hover:bg-mist/60"
        >
          <span className="flex-1">
            <span className="block font-display text-[1.0625rem] font-bold tracking-tight text-ink">
              {domain.name}
            </span>
            <span className="mt-2 block text-[0.875rem] leading-relaxed text-muted">
              {domain.description}
            </span>
            <span className="mt-3 block text-[0.8125rem] font-semibold text-ink">
              {programs.length} programme{programs.length > 1 ? 's' : ''}
            </span>
          </span>

          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink transition-transform duration-300 ${
              ouverte ? 'rotate-180' : ''
            }`}
            aria-hidden
          >
            <ChevronDown className="size-4" strokeWidth={2.5} />
          </span>
        </button>
      </h3>

      {/* Les ODD du domaine restent visibles carte fermée : c'est la section
          que lisent les bailleurs, elle ne doit pas dépendre d'un clic. */}
      <div className="border-t border-ink/8 px-6 py-4">
        <SdgBadges sdgs={domain.sdgs} />
      </div>

      <div id={panneau} hidden={!ouverte} className="border-t border-ink/8 bg-mist/40 px-6 py-2">
        {programs.length === 0 ? (
          <p className="py-4 text-[0.875rem] text-muted">
            Aucun programme ne correspond au filtre pour ce domaine.
          </p>
        ) : (
          <ul>
            {programs.map((program) => (
              <li key={program.id} className="border-b border-ink/8 last:border-0">
                <Link
                  href={`/programmes/${program.slug}`}
                  className="group flex items-center gap-4 py-4"
                >
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center gap-2.5">
                      <span className="font-display text-[0.9375rem] font-semibold tracking-tight text-ink">
                        {program.title}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold ${
                          ETATS[program.status]?.classe ?? ETATS.ACTIF.classe
                        }`}
                      >
                        {ETATS[program.status]?.label ?? program.status}
                      </span>
                    </span>
                    <span className="mt-1 block text-[0.8125rem] leading-relaxed text-muted">
                      {program.description}
                    </span>
                    {(program._count?.projects ?? 0) > 0 && (
                      <span className="mt-1 block text-[0.75rem] text-muted">
                        {program._count?.projects} projet
                        {(program._count?.projects ?? 0) > 1 ? 's' : ''} rattaché
                        {(program._count?.projects ?? 0) > 1 ? 's' : ''}
                      </span>
                    )}
                  </span>

                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink transition-all duration-300 group-hover:bg-gold group-hover:translate-x-1"
                    aria-hidden
                  >
                    <ArrowRight className="size-4" strokeWidth={2.5} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function DomainExplorer({ domains }: { domains: Domain[] }) {
  const [domaineChoisi, setDomaineChoisi] = useState<string | null>(null);
  const [etatChoisi, setEtatChoisi] = useState<Etat | null>(null);
  const [ouvertes, setOuvertes] = useState<string[]>([]);

  // On n'affiche un filtre d'état que pour les valeurs réellement présentes :
  // une puce qui ne renvoie jamais rien n'aide personne.
  const etatsPresents = useMemo(() => {
    const vus = new Set<Etat>();
    for (const domaine of domains) {
      for (const programme of domaine.programs ?? []) vus.add(programme.status);
    }
    return (Object.keys(ETATS) as Etat[]).filter((etat) => vus.has(etat));
  }, [domains]);

  const visibles = useMemo(
    () =>
      domains
        .filter((domaine) => !domaineChoisi || domaine.slug === domaineChoisi)
        .map((domaine) => ({
          domaine,
          programmes: (domaine.programs ?? []).filter(
            (programme) => !etatChoisi || programme.status === etatChoisi,
          ),
        }))
        // Filtrer par état peut vider un domaine : on ne montre pas une carte
        // qui annonce zéro programme.
        .filter(({ programmes }) => !etatChoisi || programmes.length > 0),
    [domains, domaineChoisi, etatChoisi],
  );

  const basculer = (slug: string) =>
    setOuvertes((actuelles) =>
      actuelles.includes(slug) ? actuelles.filter((s) => s !== slug) : [...actuelles, slug],
    );

  // Choisir un domaine ouvre sa carte : le filtre et le dépliage sont le même
  // geste du point de vue du visiteur.
  const choisirDomaine = (slug: string | null) => {
    setDomaineChoisi(slug);
    if (slug) setOuvertes((actuelles) => (actuelles.includes(slug) ? actuelles : [...actuelles, slug]));
  };

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[0.75rem] font-semibold tracking-wide text-muted uppercase">
            Domaine
          </span>
          <Puce actif={domaineChoisi === null} onClick={() => choisirDomaine(null)}>
            Tous
          </Puce>
          {domains.map((domaine) => (
            <Puce
              key={domaine.id}
              actif={domaineChoisi === domaine.slug}
              onClick={() => choisirDomaine(domaine.slug)}
            >
              {domaine.name}
            </Puce>
          ))}
        </div>

        {etatsPresents.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[0.75rem] font-semibold tracking-wide text-muted uppercase">
              État
            </span>
            <Puce actif={etatChoisi === null} onClick={() => setEtatChoisi(null)}>
              Tous
            </Puce>
            {etatsPresents.map((etat) => (
              <Puce
                key={etat}
                actif={etatChoisi === etat}
                onClick={() => setEtatChoisi(etat)}
              >
                {ETATS[etat].label}
              </Puce>
            ))}
          </div>
        )}
      </div>

      {visibles.length === 0 ? (
        <p className="mt-10 text-[0.9375rem] text-muted">
          Aucun programme ne correspond à ces filtres pour le moment.
        </p>
      ) : (
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {visibles.map(({ domaine, programmes }) => (
            <CarteDomaine
              key={domaine.id}
              domain={domaine}
              programs={programmes}
              ouverte={ouvertes.includes(domaine.slug)}
              onBascule={() => basculer(domaine.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
