'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { EASE_EXPO, VIEWPORT } from './motion-config';

interface SplitHeadingProps {
  /**
   * Une entrée par ligne. Le découpage est décidé à la rédaction et non
   * calculé : c'est ce qui permet de choisir où le titre se casse, comme sur
   * les maquettes.
   */
  lines: ReactNode[];
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
  delay?: number;
}

const TAGS = { h1: motion.h1, h2: motion.h2, h3: motion.h3 } as const;

/**
 * Titre révélé ligne par ligne : chaque ligne monte derrière un masque, avec
 * un léger décalage. C'est la signature typographique du site — réservée aux
 * grands titres, pour qu'elle garde son effet.
 *
 * Comme les blocs de `Reveal`, le titre s'affiche sans attendre s'il est déjà
 * visible ou déjà dépassé au montage : un défilement rapide avant la fin de
 * l'hydratation ne doit pas laisser un titre masqué.
 */
export function SplitHeading({ lines, className, as = 'h2', delay = 0 }: SplitHeadingProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLHeadingElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const box = ref.current?.getBoundingClientRect();
    if (box && box.top < window.innerHeight) setShow(true);
  }, []);

  const Animated = TAGS[as];
  const Plain = as;

  if (reduced) {
    return (
      <Plain className={className}>
        {lines.map((line, index) => (
          <span key={index} className="block">
            {line}
          </span>
        ))}
      </Plain>
    );
  }

  return (
    <Animated
      ref={ref}
      className={className}
      initial="hidden"
      animate={show ? 'shown' : undefined}
      whileInView="shown"
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: 0.09, delayChildren: delay } },
      }}
    >
      {lines.map((line, index) => (
        <span key={index} className="line-mask">
          <motion.span
            data-reveal-line
            className="block"
            variants={{
              hidden: { y: '112%' },
              shown: { y: '0%', transition: { duration: 0.9, ease: EASE_EXPO } },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Animated>
  );
}
