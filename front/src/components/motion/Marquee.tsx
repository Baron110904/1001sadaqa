import { Heart } from 'lucide-react';

/**
 * Bande défilante « De l'assistance à l'autonomie ».
 *
 * Le défilement est purement CSS, donc sans coût JavaScript et sans hydratation :
 * le contenu est dupliqué une fois et l'animation translate de -50 %, ce qui
 * boucle sans couture. `prefers-reduced-motion` la fige (voir globals.css).
 */
export function Marquee({ text, repeat = 4 }: { text: string; repeat?: number }) {
  const items = Array.from({ length: repeat * 2 });

  return (
    <div
      className="relative overflow-hidden border-y border-ink/10 bg-sand py-4"
      aria-hidden
    >
      <div className="flex w-max animate-(--animate-marquee) items-center gap-10 pr-10">
        {items.map((_, index) => (
          <span key={index} className="flex shrink-0 items-center gap-10">
            <span className="font-display text-sm font-bold tracking-[0.2em] whitespace-nowrap text-ink/75 uppercase">
              {text}
            </span>
            <Heart className="size-3.5 shrink-0 fill-gold text-gold" />
          </span>
        ))}
      </div>

      {/* Les extrémités s'estompent : la bande n'a pas de début ni de fin visibles. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-linear-to-r from-sand to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-linear-to-l from-sand to-transparent" />
    </div>
  );
}
