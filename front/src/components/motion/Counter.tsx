'use client';

import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { EASE_SOFT } from './motion-config';
import { formatNumber } from '@/lib/format';

interface CounterProps {
  value: number;
  /** Ajouté après le nombre, par exemple « + ». */
  suffix?: string;
  className?: string;
  duration?: number;
}

/**
 * Nombre qui se compte à l'entrée dans le champ de vision.
 *
 * La valeur finale est présente dans le DOM dès le rendu serveur (attribut
 * `data-value` et contenu initial) : un lecteur d'écran ou un moteur
 * d'indexation lit le chiffre juste, même sans JavaScript.
 */
export function Counter({ value, suffix = '', className, duration = 1.5 }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduced || !inView) return;

    setDisplay(0);
    const controls = animate(0, value, {
      duration,
      ease: EASE_SOFT,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, reduced, value, duration]);

  return (
    <span ref={ref} className={`tabular ${className ?? ''}`} data-value={value}>
      {formatNumber(display)}
      {suffix}
    </span>
  );
}
