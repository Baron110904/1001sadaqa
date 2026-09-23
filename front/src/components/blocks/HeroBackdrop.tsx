'use client';

import Image from 'next/image';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import type { PointerEvent } from 'react';

/**
 * Arrière-plan du héros : photographie assombrie, halo suivant le curseur,
 * et léger recul au défilement.
 *
 * Le halo n'est activé qu'au pointeur fin. Sur mobile, il resterait figé au
 * dernier point touché, ce qui produirait une tache immobile.
 */
export function HeroBackdrop({ src, alt }: { src: string; alt: string }) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();

  // L'image recule pendant que la page défile : le héros paraît plus profond.
  const y = useTransform(scrollY, [0, 700], [0, 110]);
  const scale = useTransform(scrollY, [0, 700], [1, 1.08]);

  const rawX = useMotionValue(50);
  const rawY = useMotionValue(38);
  const glowX = useSpring(rawX, { stiffness: 60, damping: 22 });
  const glowY = useSpring(rawY, { stiffness: 60, damping: 22 });
  // Halo discret : l'image étant maintenant bien visible, il n'a plus à
  // meubler le fond, seulement à réagir au curseur.
  const glow = useMotionTemplate`radial-gradient(44rem 32rem at ${glowX}% ${glowY}%, rgb(59 122 63 / 0.20), transparent 70%)`;

  const track = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    rawX.set(((event.clientX - box.left) / box.width) * 100);
    rawY.set(((event.clientY - box.top) / box.height) * 100);
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink" onPointerMove={track}>
      <motion.div
        className="absolute inset-0"
        style={reduced ? undefined : { y, scale }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_28%] opacity-80"
        />
      </motion.div>

      {/*
        Voile dégradé. Il est franc à gauche, là où se posent le titre et le
        chapeau, et s'ouvre vers la droite pour laisser voir la photographie.
        C'est ce qui permet de monter l'opacité de l'image sans perdre le
        contraste du texte.
      */}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-ink via-ink/80 via-45% to-ink/25"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-ink via-ink/70 to-transparent"
      />

      {!reduced && <motion.div aria-hidden className="absolute inset-0" style={{ background: glow }} />}

      <div className="grain absolute inset-0" aria-hidden />
    </div>
  );
}
