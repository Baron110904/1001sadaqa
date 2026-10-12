'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LANGUES, LANGUE_PAR_DEFAUT, NOMS_DE_LANGUE, estUneLangue } from '@/lib/langues';
import { useLangue } from '@/lib/langue-client';

/**
 * Bascule entre les langues, sur la page où l'on se trouve.
 *
 * Elle ne ramène pas à l'accueil : le visiteur qui lit la page des projets en
 * français doit arriver sur la même page en anglais. Le chemin courant est
 * donc dépouillé de son préfixe de langue, puis repréfixé.
 *
 * `next/link` est utilisé directement, et non `Lien` : ce dernier préfixe de
 * la langue **en cours**, ce qui est exactement ce qu'il ne faut pas ici.
 */
export function ChoixDeLangue() {
  const langue = useLangue();
  const chemin = usePathname() ?? '/';

  // Chemin sans préfixe de langue : c'est la partie commune aux deux versions.
  const segments = chemin.split('/');
  const nu = estUneLangue(segments[1] ?? '') ? '/' + segments.slice(2).join('/') : chemin;
  const base = nu === '/' || nu === '' ? '' : nu;

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Langue du site">
      {LANGUES.map((cible) => {
        const adresse = cible === LANGUE_PAR_DEFAUT ? base || '/' : `/${cible}${base}`;
        const active = cible === langue;

        return (
          <Link
            key={cible}
            href={adresse}
            hrefLang={cible}
            aria-current={active ? 'true' : undefined}
            className={`rounded-full px-2.5 py-1.5 font-display text-[0.75rem] font-bold tracking-wide uppercase transition-colors ${
              active ? 'bg-paper/15 text-paper' : 'text-paper/55 hover:text-paper'
            }`}
          >
            <span className="sr-only">{NOMS_DE_LANGUE[cible]}</span>
            <span aria-hidden>{cible}</span>
          </Link>
        );
      })}
    </div>
  );
}
