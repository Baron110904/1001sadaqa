import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

interface MediaFrameProps {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Libellé affiché quand aucun visuel n'est encore rattaché au contenu. */
  placeholder?: string;
  /** Agrandissement de l'image au survol du bloc parent (groupe `group`). */
  zoomOnHover?: boolean;
  rounded?: string;
}

/**
 * Cadre média unique du site.
 *
 * Quand un contenu n'a pas encore de visuel — cas fréquent après une saisie
 * en back-office — le cadre affiche un aplat sable et le sujet attendu, dans
 * la charte, plutôt qu'une image cassée ou un trou dans la mise en page.
 */
export function MediaFrame({
  src,
  alt,
  className = '',
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  placeholder,
  zoomOnHover = false,
  rounded = 'rounded-card',
}: MediaFrameProps) {
  if (!src) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-sand ${rounded} ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="flex flex-col items-center gap-2 px-6 text-center">
          <ImageIcon className="size-5 text-ink/25" aria-hidden />
          <span className="font-display text-[0.625rem] font-bold tracking-[0.18em] text-ink/40 uppercase">
            {placeholder ?? alt}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-sand ${rounded} ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${
          zoomOnHover
            ? 'transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]'
            : ''
        }`}
      />
    </div>
  );
}
