'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Domain } from '@/lib/types';

/** Temps d'arrêt sur chaque carte, en millisecondes. */
const CADENCE = 4000;

/**
 * Durée du glissement d'une carte à la suivante.
 *
 * Elle est longue à dessein. Le `behavior: 'smooth'` du navigateur expédie le
 * mouvement en trois cents millisecondes, avec un freinage sec à l'arrivée :
 * la bande paraît sauter d'une carte à l'autre plutôt que glisser. On anime
 * donc la position à la main, sur une courbe douce aux deux bouts.
 */
const GLISSEMENT = 1300;

/**
 * Accélération puis freinage progressifs (cubique).
 *
 * Une progression linéaire démarre et s'arrête net ; c'est précisément ce qui
 * donnait au défilement son caractère brusque.
 */
const adoucir = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

/**
 * Teintes des cartes, relevées au pixel sur la maquette.
 *
 * Elles ne sont pas décoratives : un premier essai avait choisi des crèmes à
 * trois points du fond de section, et les cartes s'y fondaient au point de
 * devenir illisibles. Chaque teinte porte donc son bord et sa pastille, assez
 * contrastés pour détacher la carte de son fond.
 */
const TEINTES = [
  { fond: 'bg-[#fff8e6]', bord: 'border-[#f6ba38]', pastille: 'bg-[#f5b324] text-[#0b2e15]', puce: 'bg-[#f5b324]', compte: 'text-[#b07d0c]' },
  { fond: 'bg-[#eef6f0]', bord: 'border-[#35875d]', pastille: 'bg-[#1f7a4d] text-white', puce: 'bg-[#1f7a4d]', compte: 'text-[#1f7a4d]' },
  { fond: 'bg-[#f1f3ef]', bord: 'border-[#23422b]', pastille: 'bg-[#23422b] text-white', puce: 'bg-[#23422b]', compte: 'text-[#23422b]' },
  { fond: 'bg-[#fbf1e1]', bord: 'border-[#cd942f]', pastille: 'bg-[#c8891a] text-white', puce: 'bg-[#c8891a]', compte: 'text-[#9c6a12]' },
];

/**
 * Le carrousel des domaines d'intervention.
 *
 * Il avance d'une carte toutes les quatre secondes, **toujours vers la
 * gauche** : la liste est doublée dans la piste, si bien qu'arrivé au dernier
 * domaine le premier revient par la droite au lieu que la bande reparte en
 * arrière. Le rembobinage se fait d'un exemplaire complet, sans animation —
 * les deux copies étant identiques, rien ne se voit.
 *
 * Le glissement lui-même est animé à la main, sur plus d'une seconde : confié
 * au navigateur, il durait trois cents millisecondes et s'arrêtait net, ce qui
 * donnait l'impression que la bande sautait d'une carte à l'autre.
 *
 * L'avance s'arrête dès que le visiteur s'en approche : au survol, au clavier,
 * ou s'il a demandé à son système de réduire les animations. Une vitrine qui
 * continue de défiler pendant qu'on lit une carte fait perdre la ligne.
 */
export function CarrouselDomaines({ domains }: { domains: Domain[] }) {
  const piste = useRef<HTMLUListElement>(null);
  const [actif, setActif] = useState(0);
  const [enPause, setEnPause] = useState(false);

  const total = domains.length;
  // Deux exemplaires : c'est ce qui donne au défilement sa continuité.
  const cartes = total > 1 ? [...domains, ...domains] : domains;

  /** Largeur d'une carte, écart compris. Mesurée, jamais supposée. */
  const pasDeLaPiste = () => {
    const el = piste.current;
    if (!el || el.children.length < 2) return 0;
    const a = el.children[0] as HTMLElement;
    const b = el.children[1] as HTMLElement;
    return b.offsetLeft - a.offsetLeft;
  };

  /** Largeur d'un exemplaire complet de la liste. */
  const unTour = () => pasDeLaPiste() * total;

  /** Image en cours de l'animation, pour pouvoir l'interrompre. */
  const animation = useRef<number | null>(null);

  /**
   * Amène la bande à une position, en l'y faisant glisser.
   *
   * On écrit `scrollLeft` image par image plutôt que de confier le mouvement
   * au navigateur : sa durée n'est pas réglable, et son freinage brutal est
   * ce qui donnait au carrousel son allure saccadée. Le conteneur reste un
   * vrai conteneur à défilement — la bande se parcourt toujours au doigt.
   */
  const glisserVers = useCallback((cible: number) => {
    const el = piste.current;
    if (!el) return;

    if (animation.current !== null) cancelAnimationFrame(animation.current);

    const depart = el.scrollLeft;
    const course = cible - depart;
    if (Math.abs(course) < 1) return;

    // Qui a demandé moins d'animations n'en reçoit aucune.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.scrollLeft = cible;
      return;
    }

    const debut = performance.now();
    const image = (maintenant: number) => {
      const avancement = Math.min(1, (maintenant - debut) / GLISSEMENT);
      el.scrollLeft = depart + course * adoucir(avancement);
      animation.current = avancement < 1 ? requestAnimationFrame(image) : null;
    };
    animation.current = requestAnimationFrame(image);
  }, []);

  // Une animation en cours ne doit pas survivre au démontage du composant.
  useEffect(
    () => () => {
      if (animation.current !== null) cancelAnimationFrame(animation.current);
    },
    [],
  );

  const aller = useCallback(
    (sens: 1 | -1) => {
      const el = piste.current;
      if (!el) return;
      const pas = pasDeLaPiste();
      if (!pas) return;
      const tour = unTour();

      // Le rembobinage se fait **avant** le mouvement, jamais pendant.
      // Déplacer la bande alors qu'un glissement est en cours le ferait
      // repartir d'une position fausse, et le saut se verrait. Ici la position
      // est corrigée à l'arrêt, entre deux avances, et les deux exemplaires
      // étant identiques, l'œil ne distingue rien.
      if (sens === 1 && el.scrollLeft >= tour - 1) el.scrollLeft -= tour;

      // Reculer depuis le tout début ferait buter la bande : on la reporte
      // d'abord à la fin du premier exemplaire, d'où le recul est possible.
      if (sens === -1 && el.scrollLeft < pas) el.scrollLeft += tour;

      glisserVers(el.scrollLeft + sens * pas);
      setActif((n) => (n + sens + total) % total);
    },
    // `pasDeLaPiste` et `unTour` lisent le DOM à l'appel : rien à mémoriser.
    [total, glisserVers],
  );

  useEffect(() => {
    if (total < 2 || enPause) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const minuteur = window.setInterval(() => aller(1), CADENCE);
    return () => window.clearInterval(minuteur);
  }, [total, enPause, aller]);

  if (total === 0) return null;

  return (
    <div
      onMouseEnter={() => setEnPause(true)}
      onMouseLeave={() => setEnPause(false)}
      onFocusCapture={() => setEnPause(true)}
      onBlurCapture={() => setEnPause(false)}
    >
      {total > 1 && (
        <div className="mb-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => aller(-1)}
            aria-label="Domaine précédent"
            className="flex size-11 items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-ink/85"
          >
            <ArrowLeft className="size-5" strokeWidth={2.2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => aller(1)}
            aria-label="Domaine suivant"
            className="flex size-11 items-center justify-center rounded-full bg-gold text-ink transition-colors hover:bg-gold-deep"
          >
            <ArrowRight className="size-5" strokeWidth={2.2} aria-hidden />
          </button>
        </div>
      )}

      <ul
        ref={piste}
        // La barre de défilement est masquée — les deux déclarations sont
        // nécessaires, Firefox ne connaissant pas `::-webkit-scrollbar` et
        // Chrome ignorant `scrollbar-width`. Le défilement reste possible au
        // doigt ; seul son rail disparaît.
        // `scrollBehavior: auto` est indispensable : le glissement est écrit
        // image par image, et un défilement « smooth » du navigateur viendrait
        // animer chacune de ces écritures par-dessus la nôtre.
        style={{ scrollbarWidth: 'none', scrollBehavior: 'auto' }}
        className="flex gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {cartes.map((domaine, rang) => {
          // Les deux exemplaires partagent la teinte de leur domaine.
          const indice = rang % total;
          const teinte = TEINTES[indice % TEINTES.length];
          const programmes = domaine.programs ?? [];

          return (
            <li
              key={`${domaine.id}-${rang}`}
              // Trois cartes à l'écran sur grand format, deux sur tablette,
              // une seule sur téléphone — où trois seraient illisibles. La
              // largeur est une part du conteneur moins sa part d'écart.
              className="w-full shrink-0 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
              aria-hidden={rang >= total}
            >
              <div
                className={`flex h-full flex-col items-center rounded-[50%/20%] border-2 px-8 py-10 text-center ${teinte.fond} ${teinte.bord}`}
              >
                <span
                  className={`flex size-14 items-center justify-center rounded-full font-display text-[1.125rem] font-bold tabular ${teinte.pastille}`}
                >
                  {String(indice + 1).padStart(2, '0')}
                </span>

                <h3 className="mt-5 font-display text-[1.125rem] font-bold tracking-tight text-ink">
                  {domaine.name}
                </h3>

                <p className={`mt-1 text-[0.8125rem] font-semibold ${teinte.compte}`}>
                  {programmes.length} programme{programmes.length > 1 ? 's' : ''}
                </p>

                {programmes.length > 0 && (
                  <ul className="mt-5 space-y-2 text-left">
                    {programmes.map((programme) => (
                      <li
                        key={programme.id}
                        className="flex items-start gap-2 text-[0.875rem] text-ink/85"
                      >
                        <span
                          className={`mt-1.5 size-1.5 shrink-0 rounded-full ${teinte.puce}`}
                          aria-hidden
                        />
                        {programme.shortLabel ?? programme.title}
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href={`/programmes#${domaine.slug}`}
                  // `link-tap` porte la cible à 24 px de haut : sans elle le
                  // lien n'en mesurait que 21, sous le minimum atteignable au
                  // doigt.
                  className="link-tap group mt-7 inline-flex items-center gap-2 font-display text-[0.875rem] font-semibold text-ink"
                  tabIndex={rang >= total ? -1 : undefined}
                >
                  Découvrir
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {total > 1 && (
        <div className="mt-8 flex justify-center">
          {domains.map((domaine, rang) => (
            // Le creux autour du point porte la cible tactile à 24 px dans les
            // deux sens : le point seul mesure 8 px de côté.
            <button
              key={domaine.id}
              type="button"
              onClick={() => {
                const el = piste.current;
                const pas = pasDeLaPiste();
                if (!el || !pas) return;
                // On vise la carte dans l'exemplaire en cours, pour ne pas
                // faire repartir la bande en arrière.
                const copie = Math.floor(el.scrollLeft / (pas * total));
                glisserVers((copie * total + rang) * pas);
                setActif(rang);
              }}
              aria-label={`Aller au domaine ${domaine.name}`}
              aria-current={rang === actif}
              className="group px-2.5 py-2.5"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  rang === actif ? 'w-7 bg-gold' : 'w-2 bg-ink/15 group-hover:bg-ink/30'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
