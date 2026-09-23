import Image from 'next/image';
import type { Partner } from '@/lib/types';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';

/**
 * Bandeau des partenaires.
 *
 * Chaque logo est centré dans une boîte de proportions fixes, quelle que soit
 * la forme du fichier d'origine. Le composant supposait auparavant un gabarit
 * commun de 900 × 360 : un logo carré s'étirait alors sur toute la hauteur et
 * désalignait sa rangée. L'association n'a pas à retoucher ses fichiers pour
 * que le mur tienne debout.
 *
 * Les logos ne sont pas désaturés : respecter une marque, c'est la montrer
 * telle qu'elle est. Un partenaire sans adresse de site est rendu en bloc
 * simple, sans lien mort.
 */
export function PartnerLogos({ partners }: { partners: Partner[] }) {
  if (!partners.length) return null;

  return (
    <RevealGroup
      className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      stagger={0.08}
      as="ul"
    >
      {partners.map((partner) => {
        const tile = (
          <span className="flex items-center justify-center rounded-card border border-ink/10 bg-paper px-5 py-4 transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:border-gold/45 group-hover:shadow-soft">
            {/* Boîte de proportions fixes : `fill` avec `object-contain`
                inscrit le logo dedans sans le déformer, qu'il soit large ou
                carré. C'est ce qui garde les rangées alignées. */}
            <span className="relative block aspect-5/2 w-full">
              <Image
                src={partner.logo}
                alt={partner.name}
                fill
                sizes="(max-width: 640px) 45vw, 22vw"
                className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              />
            </span>
          </span>
        );

        return (
          <RevealItem key={partner.id} as="li">
            {partner.website ? (
              <a
                href={partner.website}
                target="_blank"
                rel="noreferrer noopener"
                className="group block"
                title={partner.name}
              >
                {tile}
              </a>
            ) : (
              <div className="group" title={partner.name}>
                {tile}
              </div>
            )}
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
