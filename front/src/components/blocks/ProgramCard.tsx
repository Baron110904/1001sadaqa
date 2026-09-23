import { text } from '@/lib/text';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MediaFrame } from '@/components/ui/MediaFrame';
import type { Program } from '@/lib/types';

/**
 * Carte de programme du bloc « Nos domaines d'action ».
 *
 * La carte entière est cliquable — la pastille dorée est décorative, ce qui
 * évite deux liens vers la même page pour un lecteur d'écran.
 */
export async function ProgramCard({ program }: { program: Program }) {
  const t = text('common');

  return (
    <Link
      href={`/programmes/${program.slug}`}
      className="group flex h-full flex-col rounded-card border border-ink/10 bg-paper p-5 transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-gold/45 hover:shadow-lift"
    >
      <h3 className="font-display text-[1.0625rem] leading-snug font-bold tracking-tight text-ink">
        {program.title}
      </h3>

      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted">{program.description}</p>

      <MediaFrame
        src={program.image}
        alt={program.title}
        placeholder={program.shortLabel}
        rounded="rounded-full"
        zoomOnHover
        sizes="(max-width: 768px) 40vw, 160px"
        className="mx-auto my-6 aspect-square w-32"
      />

      <span className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-gold px-4 py-2.5 font-display text-[0.8125rem] font-semibold text-ink transition-colors duration-300 group-hover:bg-gold-deep">
        {t('learnMore')}
        <ArrowRight
          className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
          strokeWidth={2.5}
          aria-hidden
        />
      </span>
    </Link>
  );
}
