import type { Transition, Variants } from 'motion/react';

/**
 * Réglages de mouvement partagés.
 *
 * Un seul jeu de courbes et de durées pour tout le site : c'est ce qui fait
 * qu'une page paraît d'un seul tenant plutôt qu'un assemblage d'effets.
 *
 * `expo` est une courbe de sortie très marquée (démarrage rapide, arrivée
 * longue) : elle donne le sentiment d'un mouvement qui « se pose » au lieu de
 * s'arrêter net.
 */
export const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_SOFT = [0.33, 1, 0.68, 1] as const;

export const transition = {
  base: { duration: 0.7, ease: EASE_EXPO } satisfies Transition,
  quick: { duration: 0.36, ease: EASE_SOFT } satisfies Transition,
  press: { type: 'spring', stiffness: 420, damping: 26, mass: 0.6 } satisfies Transition,
  magnet: { type: 'spring', stiffness: 180, damping: 18, mass: 0.4 } satisfies Transition,
};

/** Distance de translation des révélations, en pixels. */
export const RISE = 26;

export const riseVariants: Variants = {
  hidden: { opacity: 0, y: RISE },
  shown: { opacity: 1, y: 0, transition: transition.base },
};

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: transition.base },
};

/** Conteneur d'une série d'éléments révélés en cascade. */
export const staggerVariants = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  shown: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Marge de déclenchement : la révélation part avant que l'élément soit centré. */
export const VIEWPORT = { once: true, margin: '-12% 0px -12% 0px' } as const;
