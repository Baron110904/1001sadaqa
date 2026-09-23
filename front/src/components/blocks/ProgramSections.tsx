import type { Program, SiteEvent } from '@/lib/types';
import { formatDateRange } from '@/lib/format';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';

/**
 * Les rubriques d'une fiche programme (§4.4).
 *
 * Une rubrique vide n'est pas affichée, mais sa place dans l'ordre est fixe :
 * toutes les fiches se lisent donc de la même façon, quel que soit le nombre de
 * rubriques renseignées.
 */
export function ProgramSections({ program }: { program: Program }) {
  const rubriques: { titre: string; texte?: string | null; liste?: string[] }[] = [
    { titre: 'Le défi', texte: program.context },
    { titre: 'Nos objectifs', texte: program.objectives },
    { titre: 'Qui est accompagné', texte: program.audience },
    { titre: 'Ce que nous mettons en œuvre', liste: program.activities },
    { titre: 'Ce que le programme produit', texte: program.outcomes },
  ];

  const renseignees = rubriques.filter(
    (r) => (r.texte && r.texte.trim()) || (r.liste && r.liste.length > 0),
  );

  if (renseignees.length === 0) {
    return <p className="text-[0.9375rem] leading-relaxed text-muted">{program.description}</p>;
  }

  return (
    <div className="space-y-9">
      {renseignees.map((rubrique) => (
        <Reveal key={rubrique.titre} from="none">
          <section>
            <h3 className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
              {rubrique.titre}
            </h3>

            {rubrique.texte && (
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{rubrique.texte}</p>
            )}

            {rubrique.liste && rubrique.liste.length > 0 && (
              <ul className="mt-4 space-y-2.5">
                {rubrique.liste.map((element) => (
                  <li
                    key={element}
                    className="flex gap-3 text-[0.9375rem] leading-relaxed text-muted"
                  >
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-gold"
                      aria-hidden
                    />
                    {element}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Reveal>
      ))}
    </div>
  );
}

/** Étiquettes des types d'événement, telles qu'on les lit à l'écran. */
const TYPES: Record<SiteEvent['kind'], string> = {
  DISTRIBUTION: 'Distribution',
  CAMPAGNE_SANTE: 'Campagne de santé',
  SENSIBILISATION: 'Sensibilisation',
  COLLECTE: 'Collecte',
  JOURNEE_SOLIDAIRE: 'Journée solidaire',
};

const RECURRENCES: Record<SiteEvent['recurrence'], string> = {
  PONCTUEL: '',
  ANNUEL: 'Chaque année',
  MENSUEL: 'Chaque mois',
};

/**
 * Événements produits par un programme (§4.5).
 *
 * Les chiffres accompagnent chaque édition : un événement sans résultat
 * documenté ne prouve rien.
 */
export function ProgramEvents({ events }: { events: SiteEvent[] }) {
  if (events.length === 0) return null;

  return (
    <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2" stagger={0.07}>
      {events.map((evenement) => (
        <RevealItem key={evenement.id}>
          <article className="h-full rounded-panel border border-ink/10 bg-paper p-6">
            <p className="flex flex-wrap items-center gap-2 text-[0.75rem] font-semibold text-leaf">
              <span className="rounded-full bg-leaf/10 px-2.5 py-1">{TYPES[evenement.kind]}</span>
              {RECURRENCES[evenement.recurrence] && (
                <span className="text-muted">{RECURRENCES[evenement.recurrence]}</span>
              )}
            </p>

            <h3 className="mt-3 font-display text-[1.0625rem] font-bold tracking-tight text-ink">
              {evenement.title}
            </h3>

            <p className="mt-1.5 text-[0.8125rem] text-muted">
              {formatDateRange(evenement.startDate, evenement.endDate)} · {evenement.location}
            </p>

            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
              {evenement.description}
            </p>

            {evenement.figures.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-ink/10 pt-4">
                {evenement.figures.map((chiffre) => (
                  <li key={chiffre} className="font-display text-[0.875rem] font-semibold text-ink">
                    {chiffre}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
