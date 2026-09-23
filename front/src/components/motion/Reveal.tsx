'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { RISE, staggerVariants, transition, VIEWPORT } from './motion-config';

/**
 * Balises disponibles pour les conteneurs de révélation.
 *
 * Les composants animés sont créés une fois, au chargement du module.
 * Appeler `motion.create()` pendant le rendu produirait un composant neuf à
 * chaque passe, donc un remontage du sous-arbre à chaque rendu.
 */
const TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  ul: motion.ul,
  span: motion.span,
  p: motion.p,
  header: motion.header,
  figure: motion.figure,
} as const;

type Tag = keyof typeof TAGS;

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Retard avant le départ, en secondes. */
  delay?: number;
  /** Direction d'arrivée. `none` ne fait qu'un fondu. */
  from?: 'bottom' | 'left' | 'right' | 'none';
  as?: Tag;
}

function offset(from: RevealProps['from']) {
  switch (from) {
    case 'left':
      return { x: -RISE, y: 0 };
    case 'right':
      return { x: RISE, y: 0 };
    case 'none':
      return { x: 0, y: 0 };
    default:
      return { x: 0, y: RISE };
  }
}

/**
 * Décide s'il faut afficher le bloc sans attendre son entrée dans le champ.
 *
 * `whileInView` ne se déclenche qu'à l'entrée dans la fenêtre. Un visiteur qui
 * défile avant la fin de l'hydratation peut donc dépasser une section : elle
 * n'entrera jamais dans le champ tant qu'il ne remonte pas, et resterait
 * vide. On regarde donc, au montage, si le bloc est déjà visible ou déjà
 * dépassé — dans ce cas on l'affiche directement.
 */
function useShowImmediately() {
  const node = useRef<HTMLElement | null>(null);
  const [show, setShow] = useState(false);

  // Ref de rappel plutôt que `useRef` : les balises animées possibles n'ont
  // pas le même type d'élément, et un objet ref typé `HTMLElement` ne
  // satisfait pas leur intersection de types.
  const ref = useCallback((instance: HTMLElement | null) => {
    node.current = instance;
  }, []);

  useEffect(() => {
    const box = node.current?.getBoundingClientRect();
    if (box && box.top < window.innerHeight) setShow(true);
  }, []);

  return { ref, show };
}

/**
 * Révélation d'un bloc à son entrée dans le champ de vision.
 *
 * Si le système demande de réduire les animations, le contenu est rendu dans
 * une balise ordinaire : aucun risque de laisser un bloc à opacité zéro.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  from = 'bottom',
  as = 'div',
}: RevealProps) {
  const reduced = useReducedMotion();
  const { ref, show } = useShowImmediately();
  const Animated = TAGS[as];
  const Plain = as;

  if (reduced) return <Plain className={className}>{children}</Plain>;

  const { x, y } = offset(from);

  return (
    <Animated
      ref={ref}
      data-reveal
      className={className}
      initial={{ opacity: 0, x, y }}
      animate={show ? { opacity: 1, x: 0, y: 0 } : undefined}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={VIEWPORT}
      transition={{ ...transition.base, delay }}
    >
      {children}
    </Animated>
  );
}

/** Conteneur d'une cascade. Ses enfants directs doivent être des `RevealItem`. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  as = 'div',
}: RevealProps & { stagger?: number }) {
  const reduced = useReducedMotion();
  const { ref, show } = useShowImmediately();
  const Animated = TAGS[as];
  const Plain = as;

  if (reduced) return <Plain className={className}>{children}</Plain>;

  return (
    <Animated
      ref={ref}
      data-reveal
      className={className}
      initial="hidden"
      animate={show ? 'shown' : undefined}
      whileInView="shown"
      viewport={VIEWPORT}
      variants={staggerVariants(stagger, delay)}
    >
      {children}
    </Animated>
  );
}

export function RevealItem({
  children,
  className,
  from = 'bottom',
  as = 'div',
}: Omit<RevealProps, 'delay'>) {
  const reduced = useReducedMotion();
  const Animated = TAGS[as];
  const Plain = as;

  if (reduced) return <Plain className={className}>{children}</Plain>;

  const { x, y } = offset(from);

  // L'état vient du `RevealGroup` parent, qui porte déjà la garantie
  // d'affichage : rien à décider ici.
  return (
    <Animated
      data-reveal
      className={className}
      variants={{
        hidden: { opacity: 0, x, y },
        shown: { opacity: 1, x: 0, y: 0, transition: transition.base },
      }}
    >
      {children}
    </Animated>
  );
}
