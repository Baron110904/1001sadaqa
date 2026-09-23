/**
 * Décor des campagnes de fête : croissant, étoiles, lanternes.
 *
 * Tout est dessiné en SVG inline et animé en CSS — aucune image à charger,
 * aucun script. Le décor est purement ornemental : il est marqué
 * `aria-hidden`, et le réglage « mouvement réduit » du système coupe les
 * animations sans rien casser à la mise en page.
 *
 * Les positions sont figées plutôt que tirées au hasard : un rendu serveur et
 * un rendu navigateur qui ne coïncident pas produisent une erreur
 * d'hydratation, et une étoile placée au hasard finit tôt ou tard derrière le
 * texte.
 *
 * Deux intensités. En version pleine, sur l'accueil, le décor porte la page.
 * En version `discret`, sur les bandeaux des pages intérieures, il se contente
 * de rappeler la fête : pas de lanternes, moins d'étoiles, croissant plus
 * petit et repoussé dans l'angle.
 */

/** Étoiles : position en pourcentage, taille, durée et décalage. */
const ETOILES = [
  { x: 12, y: 18, taille: 5, duree: 3.4, delai: 0 },
  { x: 27, y: 9, taille: 3, duree: 2.6, delai: 1.2 },
  { x: 44, y: 22, taille: 4, duree: 4.1, delai: 2.1 },
  { x: 58, y: 12, taille: 3, duree: 3, delai: 0.6 },
  { x: 71, y: 26, taille: 5, duree: 3.7, delai: 1.7 },
  { x: 83, y: 8, taille: 3, duree: 2.9, delai: 2.6 },
  { x: 91, y: 31, taille: 4, duree: 3.3, delai: 0.9 },
  { x: 36, y: 38, taille: 3, duree: 4.4, delai: 3.1 },
  { x: 64, y: 44, taille: 4, duree: 3.1, delai: 1.4 },
  { x: 20, y: 52, taille: 3, duree: 3.8, delai: 2.3 },
] as const;

/** Lanternes suspendues : abscisse, longueur du fil, taille, décalage. */
const LANTERNES = [
  { x: 6, fil: 68, taille: 34, delai: 0 },
  { x: 14, fil: 116, taille: 26, delai: 1.4 },
  { x: 22, fil: 46, taille: 22, delai: 0.7 },
] as const;

function Etoile({ taille }: { taille: number }) {
  return (
    <svg viewBox="0 0 24 24" width={taille * 2.4} height={taille * 2.4} fill="currentColor">
      <path d="M12 0l2.2 8.1L22 12l-7.8 3.9L12 24l-2.2-8.1L2 12l7.8-3.9L12 0z" />
    </svg>
  );
}

/**
 * Lanterne suspendue.
 *
 * Le dessin commence par l'anneau d'accroche, en haut et centré sur l'axe :
 * le fil se raccorde exactement dessus. La version précédente posait le fil
 * au bord gauche du cadre, et la lanterne semblait pendre à côté de sa corde.
 */
function Lanterne({ taille }: { taille: number }) {
  return (
    <svg
      viewBox="0 0 32 52"
      width={taille}
      height={(taille * 52) / 32}
      aria-hidden
      className="block drop-shadow-[0_0_16px_rgba(242,180,42,0.4)]"
    >
      <circle cx="16" cy="3" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="6" width="10" height="4" rx="1.4" fill="currentColor" opacity="0.8" />
      <rect x="3.5" y="10" width="25" height="30" rx="9" fill="currentColor" />
      <rect x="10" y="40" width="12" height="4" rx="1.4" fill="currentColor" opacity="0.8" />
      <path d="M16 44v6" stroke="currentColor" strokeWidth="1.6" opacity="0.6" />
      <rect x="8.5" y="16" width="15" height="18" rx="6" fill="#0b2e15" opacity="0.2" />
    </svg>
  );
}

/**
 * Croissant de lune.
 *
 * Dessiné par soustraction de deux disques plutôt qu'avec un chemin courbe :
 * la forme reste nette à toute taille. L'identifiant du masque porte un
 * suffixe, sinon deux croissants sur la même page partageraient le masque du
 * premier — et le second disparaîtrait.
 */
function Croissant({ taille, cle }: { taille: number; cle: string }) {
  const masque = `croissant-masque-${cle}`;

  return (
    <svg viewBox="0 0 100 100" width={taille} height={taille} aria-hidden>
      <defs>
        <mask id={masque}>
          <rect width="100" height="100" fill="black" />
          <circle cx="50" cy="50" r="42" fill="white" />
          <circle cx="68" cy="40" r="36" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="42" fill="currentColor" mask={`url(#${masque})`} />
    </svg>
  );
}

export function FestiveDecor({
  theme,
  discret = false,
}: {
  theme: 'RAMADAN' | 'TABASKI';
  discret?: boolean;
}) {
  const ramadan = theme === 'RAMADAN';
  const etoiles = discret ? ETOILES.slice(0, 5) : ETOILES;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Croissant. Il dérive lentement de haut en bas pendant que son halo
          respire : deux mouvements de vitesses différentes, ce qui évite
          l'effet mécanique d'une seule animation. */}
      <div
        className={`animate-float absolute ${
          discret ? '-top-6 right-2 md:right-8' : 'top-8 right-4 md:top-12 md:right-16'
        }`}
      >
        <span className="relative block">
          <span className="animate-glow absolute inset-0 rounded-full bg-gold/40 blur-2xl" />
          <span className={`relative block ${discret ? 'text-gold/45' : 'text-gold'}`}>
            <Croissant
              taille={discret ? 72 : ramadan ? 132 : 96}
              cle={discret ? 'discret' : 'plein'}
            />
          </span>
        </span>
      </div>

      {etoiles.map((etoile) => (
        <span
          key={`${etoile.x}-${etoile.y}`}
          className={`animate-twinkle absolute ${discret ? 'text-paper/40' : 'text-paper/75'}`}
          style={{
            left: `${etoile.x}%`,
            top: `${etoile.y}%`,
            // Une durée propre à chaque étoile : des scintillements tous
            // synchronisés se lisent comme un clignotant.
            animationDuration: `${etoile.duree}s`,
            animationDelay: `${etoile.delai}s`,
          }}
        >
          <Etoile taille={discret ? etoile.taille * 0.8 : etoile.taille} />
        </span>
      ))}

      {/* Les lanternes n'apparaissent qu'au Ramadan en version pleine, et
          seulement à partir de la tablette : sur un téléphone elles
          passeraient sur le titre.

          Le fil et la lanterne sont dans le même élément pivotant, et le pivot
          est au tout début du fil : l'ensemble se balance d'un bloc depuis le
          plafond, comme une vraie suspension. Séparer les deux faisait osciller
          la lanterne au bout d'un fil immobile. */}
      {ramadan &&
        !discret &&
        LANTERNES.map((lanterne) => (
          <span
            key={lanterne.x}
            className="animate-sway absolute top-0 hidden origin-top flex-col items-center text-gold md:flex"
            style={{ left: `${lanterne.x}%`, animationDelay: `${lanterne.delai}s` }}
          >
            <span
              className="block w-px bg-linear-to-b from-gold/10 to-gold/50"
              style={{ height: lanterne.fil }}
            />
            <Lanterne taille={lanterne.taille} />
          </span>
        ))}
    </div>
  );
}
