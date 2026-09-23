'use client';

import { motion, useReducedMotion } from 'motion/react';
import type React from 'react';
import { EASE_EXPO, VIEWPORT } from '@/components/motion/motion-config';

interface ProgressBarProps {
  /** Part accomplie, entre 0 et 1. */
  ratio: number;
  label: string;
  tone?: 'onDark' | 'onLight';
}

/**
 * Barre de progression d'une collecte. Elle se remplit à l'entrée dans le
 * champ de vision — le mouvement est ici porteur d'information, pas décoratif.
 */
export function ProgressBar({ ratio, label, tone = 'onLight' }: ProgressBarProps) {
  const reduced = useReducedMotion();
  const percent = Math.round(ratio * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-1.5 w-full overflow-hidden rounded-full ${
        tone === 'onDark' ? 'bg-paper/15' : 'bg-ink/10'
      }`}
    >
      <motion.div
        data-progress={percent}
        className="h-full rounded-full bg-gold"
        initial={reduced ? false : { width: 0 }}
        whileInView={{ width: `${percent}%` }}
        viewport={VIEWPORT}
        transition={{ duration: 1.15, ease: EASE_EXPO, delay: 0.15 }}
        // La variable sert au repli sans JavaScript (voir le bloc noscript du
        // gabarit) : la barre s'affiche alors directement à son niveau réel.
        style={
          {
            '--noscript-width': `${percent}%`,
            ...(reduced ? { width: `${percent}%` } : {}),
          } as React.CSSProperties
        }
      />
    </div>
  );
}
