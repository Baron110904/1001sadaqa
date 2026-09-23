/**
 * Objectifs de développement durable auxquels une action contribue (§5.7).
 *
 * Les pictogrammes officiels de l'ONU sont sous licence et ne peuvent pas être
 * redistribués librement : on affiche donc le numéro et l'intitulé, dans les
 * couleurs officielles de chaque objectif. Le jour où l'association obtient les
 * fichiers, il suffira de remplacer le contenu de la pastille par l'image.
 *
 * Cette section est lue par les bailleurs institutionnels : elle doit figurer
 * même si elle intéresse peu le grand public.
 */

/** Les dix-sept objectifs, avec leur couleur officielle. */
const ODD: Record<number, { titre: string; couleur: string }> = {
  1: { titre: 'Pas de pauvreté', couleur: '#E5243B' },
  2: { titre: 'Faim « zéro »', couleur: '#DDA63A' },
  3: { titre: 'Bonne santé et bien-être', couleur: '#4C9F38' },
  4: { titre: 'Éducation de qualité', couleur: '#C5192D' },
  5: { titre: 'Égalité entre les sexes', couleur: '#FF3A21' },
  6: { titre: 'Eau propre et assainissement', couleur: '#26BDE2' },
  7: { titre: 'Énergie propre et d’un coût abordable', couleur: '#FCC30B' },
  8: { titre: 'Travail décent et croissance économique', couleur: '#A21942' },
  9: { titre: 'Industrie, innovation et infrastructure', couleur: '#FD6925' },
  10: { titre: 'Inégalités réduites', couleur: '#DD1367' },
  11: { titre: 'Villes et communautés durables', couleur: '#FD9D24' },
  12: { titre: 'Consommation et production responsables', couleur: '#BF8B2E' },
  13: { titre: 'Mesures relatives à la lutte contre les changements climatiques', couleur: '#3F7E44' },
  14: { titre: 'Vie aquatique', couleur: '#0A97D9' },
  15: { titre: 'Vie terrestre', couleur: '#56C02B' },
  16: { titre: 'Paix, justice et institutions efficaces', couleur: '#00689D' },
  17: { titre: 'Partenariats pour la réalisation des objectifs', couleur: '#19486A' },
};

export function SdgBadges({ sdgs, className = '' }: { sdgs: number[]; className?: string }) {
  const connus = sdgs.filter((numero) => ODD[numero]);
  if (connus.length === 0) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      <li className="text-[0.75rem] font-semibold tracking-wide text-muted uppercase">
        Contribue aux ODD
      </li>
      {connus.map((numero) => (
        <li key={numero}>
          <span
            className="inline-flex size-8 items-center justify-center rounded-md font-display text-[0.8125rem] font-bold text-white"
            style={{ backgroundColor: ODD[numero].couleur }}
            title={`ODD ${numero} - ${ODD[numero].titre}`}
          >
            {numero}
            <span className="sr-only"> : {ODD[numero].titre}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
