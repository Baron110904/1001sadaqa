'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useChemin } from '@/lib/langue-client';

/**
 * Lien interne qui reste dans la langue en cours.
 *
 * Le français vit à la racine — `/projets` — et l'anglais sous son préfixe —
 * `/en/projets`. Un `next/link` ordinaire posé dans une page anglaise renvoyait
 * donc le visiteur au français dès le premier clic, sans rien signaler.
 *
 * Composant client à dessein : il lit la langue dans le contexte, ce qui le
 * rend utilisable aussi bien depuis un composant serveur que depuis un
 * formulaire. `next/link` est de toute façon client.
 *
 * Les adresses externes et les ancres sont laissées telles quelles.
 */
export function Lien({ href, ...reste }: ComponentProps<typeof Link>) {
  const chemin = useChemin();
  const adresse = typeof href === 'string' ? chemin(href) : href;
  return <Link href={adresse} {...reste} />;
}
