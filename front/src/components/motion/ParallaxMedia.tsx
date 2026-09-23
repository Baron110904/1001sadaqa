'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

interface ParallaxMediaProps {
  src: string;
  alt: string;
  className?: string;
  /** Amplitude du décalage, en pourcentage de la hauteur du bloc. */
  amount?: number;
  priority?: boolean;
  sizes?: string;
  /** Voile sombre par-dessus l'image, entre 0 et 1. */
  overlay?: number;
}

/**
 * Image qui se décale légèrement au défilement.
 *
 * L'image est volontairement plus haute que son cadre (`h-[124%]` avec
 * `-top-[12%]`) : le décalage se fait donc à l'intérieur du cadre, sans jamais
 * laisser apparaître de bord vide.
 */
export function ParallaxMedia({
  src,
  alt,
  className = '',
  amount = 9,
  priority = false,
  sizes = '100vw',
  overlay = 0,
}: ParallaxMediaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div className="absolute -top-[12%] left-0 h-[124%] w-full" style={reduced ? undefined : { y }}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      </motion.div>

      {overlay > 0 && (
        <div
          aria-hidden
          className="absolute inset-0 bg-ink"
          style={{ opacity: overlay }}
        />
      )}
    </div>
  );
}
