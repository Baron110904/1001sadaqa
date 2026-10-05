'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { LANGUE_PAR_DEFAUT, cheminPour, type Langue } from './langue';
import { textePour } from './text';

/**
 * Langue courante pour les composants client.
 *
 * L'emplacement par requête de `langue.ts` repose sur `cache()` de React, qui
 * n'existe que côté serveur : les formulaires, l'en-tête et le bouton
 * WhatsApp ne peuvent pas y accéder. Ils lisent donc la langue ici, dans un
 * contexte posé une seule fois par le gabarit de langue.
 *
 * La valeur par défaut est le français : une frontière d'erreur peut se rendre
 * hors de ce contexte, et il vaut mieux qu'elle parle français que de tomber.
 */
const ContexteDeLangue = createContext<Langue>(LANGUE_PAR_DEFAUT);

export function FournisseurDeLangue({
  langue,
  children,
}: {
  langue: Langue;
  children: ReactNode;
}) {
  return <ContexteDeLangue.Provider value={langue}>{children}</ContexteDeLangue.Provider>;
}

export const useLangue = (): Langue => useContext(ContexteDeLangue);

/** Équivalent client de `text()`, lié à la langue du contexte. */
export function useText(namespace?: string): (key: string) => string {
  return textePour(useLangue(), namespace);
}

/** Préfixe un chemin interne de la langue en cours. */
export function useChemin(): (chemin: string) => string {
  const langue = useLangue();
  return (chemin: string) => cheminPour(chemin, langue);
}
