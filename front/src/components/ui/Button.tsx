'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { ComponentProps, PointerEvent, ReactNode } from 'react';
import Link from 'next/link';
import { transition } from '@/components/motion/motion-config';

export type ButtonVariant = 'primary' | 'dark' | 'outline' | 'ghost' | 'whatsapp';
export type ButtonSize = 'md' | 'lg' | 'sm';

// whitespace-nowrap : sans cela, « Faire un don » se casse en deux lignes dans
// le bandeau, où la place est comptée entre la navigation et le sélecteur de langue.
const BASE =
  'group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-display font-semibold tracking-tight whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-55';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-gold text-ink hover:bg-gold-deep',
  dark: 'bg-ink text-paper hover:bg-ink-deep',
  outline: 'border border-paper/30 text-paper hover:border-paper/70 hover:bg-paper/10',
  ghost: 'border border-ink/15 text-ink hover:border-ink/40 hover:bg-ink/5',
  whatsapp: 'bg-whatsapp text-ink hover:brightness-95',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[0.8125rem]',
  md: 'px-6 py-3 text-[0.9375rem]',
  lg: 'px-8 py-4 text-base',
};

interface SurfaceProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  withArrow?: boolean;
  /** Intensité de l'attraction du curseur, en pixels. 0 la désactive. */
  magnet?: number;
}

/**
 * Surface commune à tous les boutons du site.
 *
 * Trois comportements se superposent :
 *  - attraction : sur pointeur fin, la surface suit légèrement le curseur ;
 *  - appui : au tap comme au clic, la surface s'enfonce avec un ressort — c'est
 *    ce retour immédiat qui rend le site « réactif au toucher » sur mobile ;
 *  - reflet : une bande claire traverse le bouton au survol.
 *
 * L'attraction est coupée si le système demande de réduire les animations, et
 * sur les pointeurs grossiers, où elle n'aurait aucun sens.
 */
function useMagnet(strength: number) {
  const reduced = useReducedMotion();
  const active = strength > 0 && !reduced;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, transition.magnet);
  const y = useSpring(rawY, transition.magnet);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!active || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    rawX.set(((event.clientX - box.left) / box.width - 0.5) * strength * 2);
    rawY.set(((event.clientY - box.top) / box.height - 0.5) * strength);
  };

  const reset = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return { style: active ? { x, y } : undefined, onPointerMove, onPointerLeave: reset };
}

function Sheen() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -translate-x-[130%] bg-linear-to-r from-transparent via-white/28 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[130%]"
    />
  );
}

function Label({ children, withArrow }: { children: ReactNode; withArrow?: boolean }) {
  return (
    <span className="relative z-1 inline-flex items-center gap-2">
      {children}
      {withArrow && (
        <ArrowRight
          className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-1"
          strokeWidth={2.5}
          aria-hidden
        />
      )}
    </span>
  );
}

export function ActionLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  withArrow = true,
  magnet = 5,
  external,
}: SurfaceProps & { href: string; external?: boolean }) {
  const magnetProps = useMagnet(magnet);
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  const surface = (
    <motion.span
      className={classes}
      whileTap={{ scale: 0.96 }}
      transition={transition.press}
      {...magnetProps}
    >
      <Sheen />
      <Label withArrow={withArrow}>{children}</Label>
    </motion.span>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className="inline-flex">
        {surface}
      </a>
    );
  }

  return (
    <Link href={href} className="inline-flex">
      {surface}
    </Link>
  );
}

export function ActionButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  withArrow = false,
  magnet = 5,
  ...props
}: SurfaceProps & Omit<ComponentProps<typeof motion.button>, 'children' | 'className' | 'style'>) {
  const magnetProps = useMagnet(magnet);

  return (
    <motion.button
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      whileTap={{ scale: 0.96 }}
      transition={transition.press}
      {...magnetProps}
      {...props}
    >
      <Sheen />
      <Label withArrow={withArrow}>{children}</Label>
    </motion.button>
  );
}
