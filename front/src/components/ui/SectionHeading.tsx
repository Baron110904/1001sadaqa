import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { SplitHeading } from '@/components/motion/SplitHeading';

interface SectionHeadingProps {
  eyebrow?: string;
  /** Une entrée par ligne du titre : le point de césure est choisi, pas subi. */
  lines: ReactNode[];
  lead?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  as?: 'h1' | 'h2';
  className?: string;
  children?: ReactNode;
}

/**
 * En-tête de section : sur-titre doré, titre révélé ligne à ligne, chapeau.
 * `tone` bascule les couleurs selon que la section est claire ou sombre.
 */
export function SectionHeading({
  eyebrow,
  lines,
  lead,
  align = 'left',
  tone = 'dark',
  as = 'h2',
  className = '',
  children,
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <div
      className={`flex flex-col ${centered ? 'items-center text-center' : 'items-start'} ${className}`}
    >
      {eyebrow && (
        <Reveal from="none">
          <p className={`eyebrow mb-4 ${tone === 'light' ? 'text-gold' : 'text-leaf'}`}>
            {eyebrow}
          </p>
        </Reveal>
      )}

      <SplitHeading
        as={as}
        lines={lines}
        className={`text-title ${tone === 'light' ? 'text-paper' : 'text-ink'}`}
      />

      {lead && (
        <Reveal delay={0.12}>
          <p
            className={`mt-5 max-w-2xl text-[0.9375rem] leading-relaxed md:text-base ${
              tone === 'light' ? 'text-paper/75' : 'text-muted'
            }`}
          >
            {lead}
          </p>
        </Reveal>
      )}

      {children && <Reveal delay={0.2} className="mt-8">{children}</Reveal>}
    </div>
  );
}
