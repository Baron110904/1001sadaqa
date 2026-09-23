'use client';

import { motion, useScroll, useSpring } from 'motion/react';

/**
 * Fil doré de progression de lecture, en haut de la fenêtre.
 *
 * Utile sur les pages longues (accueil, article) : il indique où l'on en est
 * sans occuper de place. Décoratif, donc masqué aux technologies d'assistance.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-70 h-0.5 origin-left bg-gold"
    />
  );
}
