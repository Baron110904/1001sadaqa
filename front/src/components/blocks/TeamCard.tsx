'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { useState, type PointerEvent } from 'react';
import type { TeamMember } from '@/lib/types';
import { transition } from '@/components/motion/motion-config';

/** Initiales tirées du nom, pour l'état sans portrait. */
function initials(name: string): string {
  return name
    .replace(/[^\p{L}\s-]/gu, '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Carte d'un membre de l'équipe.
 *
 * Trois choses se produisent au survol : la photographie s'agrandit
 * légèrement, un voile vert monte du bas, et la fonction se dévoile sous le
 * nom. La carte s'incline aussi vers le curseur — faiblement, deux degrés au
 * plus, pour que l'effet reste un signe de réactivité et non une figure.
 *
 * Sans portrait — cas de la trésorière tant que sa photo n'est pas fournie —
 * la carte affiche les initiales sur l'aplat sable de la charte, avec la même
 * animation. L'emplacement reste donc présent et tenu, plutôt qu'absent.
 */
export function TeamCard({ member }: { member: TeamMember }) {
  const reduced = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const track = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((event.clientY - box.top) / box.height - 0.5) * -4,
      y: ((event.clientX - box.left) / box.width - 0.5) * 4,
    });
  };

  return (
    <motion.div
      className="group [perspective:1000px]"
      onPointerMove={track}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={transition.magnet}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-panel bg-sand">
        {member.image ? (
          <Image
            src={member.image}
            alt={member.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-top transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              aria-hidden
              className="font-display text-6xl font-bold tracking-tight text-ink/15 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            >
              {initials(member.name)}
            </span>
          </div>
        )}

        {/* Voile qui monte du bas au survol : il porte le texte sans l'écraser. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3 translate-y-4 bg-linear-to-t from-ink via-ink/70 to-transparent opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100"
        />

        {/* Filet doré qui se déploie en bas de carte. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-500 ease-out group-hover:scale-x-100"
        />

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="translate-y-6 font-display text-base leading-tight font-bold text-paper opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
            {member.name}
          </p>
          <p className="mt-1 translate-y-6 text-[0.8125rem] text-gold opacity-0 transition-all delay-75 duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
            {member.role}
          </p>
        </div>
      </div>

      {/* Sous la carte : lisible en permanence, y compris au toucher où il n'y
          a pas de survol. Le bloc au survol n'est qu'un complément. */}
      <p className="mt-4 font-display text-[0.9375rem] font-bold text-ink">{member.name}</p>
      <p className="text-[0.8125rem] text-muted">{member.role}</p>
    </motion.div>
  );
}
