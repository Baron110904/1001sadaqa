'use client';

import { useEffect, useId, useRef, useState } from 'react';

/**
 * Champ Ville : une liste, mais qui se filtre à la frappe.
 *
 * Les villes d'un pays peuvent se compter par milliers — près de 8 800 pour la
 * France. Les faire défiler serait intenable, et les charger toutes d'avance
 * enverrait deux mégaoctets à chaque visite. Le fichier du pays choisi est
 * donc récupéré au moment où on le choisit, et la liste se réduit à mesure
 * qu'on tape.
 *
 * La saisie libre reste acceptée : la source ne descend pas sous le millier
 * d'habitants, et personne ne doit renoncer à donner parce que son village n'y
 * figure pas.
 */

/** Pour que « Cotonou » se trouve en tapant « cotonou », et « Thiès » « thies ». */
const aplatir = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Au-delà, la liste déroulante devient une bouillie : on s'arrête là. */
const MAX_AFFICHEES = 80;

interface VilleFieldProps {
  /** Code ISO du pays choisi ; vide tant qu'aucun ne l'est. */
  pays: string;
  valeur: string;
  onChange: (ville: string) => void;
  label: string;
  placeholder: string;
  /** Message affiché tant qu'aucun pays n'est choisi. */
  attente: string;
}

export function VilleField({
  pays,
  valeur,
  onChange,
  label,
  placeholder,
  attente,
}: VilleFieldProps) {
  const id = useId();
  const [villes, setVilles] = useState<string[]>([]);
  const [chargement, setChargement] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [survol, setSurvol] = useState(0);
  const conteneur = useRef<HTMLDivElement>(null);

  // Chargement du pays choisi. Le drapeau d'abandon évite qu'une réponse
  // lente pour un pays déjà quitté ne vienne écraser la bonne liste.
  useEffect(() => {
    if (!pays) {
      setVilles([]);
      return;
    }

    let abandonne = false;
    setChargement(true);

    fetch(`/donnees/villes/${pays}.json`)
      .then((reponse) => (reponse.ok ? reponse.json() : []))
      .then((liste: string[]) => {
        if (!abandonne) setVilles(liste);
      })
      .catch(() => {
        if (!abandonne) setVilles([]);
      })
      .finally(() => {
        if (!abandonne) setChargement(false);
      });

    return () => {
      abandonne = true;
    };
  }, [pays]);

  // Un clic en dehors ferme la liste. Sans cela, elle reste ouverte par-dessus
  // la suite du formulaire.
  useEffect(() => {
    if (!ouvert) return;

    const auClic = (evenement: MouseEvent) => {
      if (!conteneur.current?.contains(evenement.target as Node)) setOuvert(false);
    };
    document.addEventListener('mousedown', auClic);
    return () => document.removeEventListener('mousedown', auClic);
  }, [ouvert]);

  const recherche = aplatir(valeur);
  const proposees = (recherche ? villes.filter((v) => aplatir(v).includes(recherche)) : villes).slice(
    0,
    MAX_AFFICHEES,
  );

  const choisir = (ville: string) => {
    onChange(ville);
    setOuvert(false);
  };

  const auClavier = (evenement: React.KeyboardEvent<HTMLInputElement>) => {
    if (evenement.key === 'Escape') {
      setOuvert(false);
      return;
    }
    if (!proposees.length) return;

    if (evenement.key === 'ArrowDown') {
      evenement.preventDefault();
      setOuvert(true);
      setSurvol((rang) => (rang + 1) % proposees.length);
    } else if (evenement.key === 'ArrowUp') {
      evenement.preventDefault();
      setSurvol((rang) => (rang - 1 + proposees.length) % proposees.length);
    } else if (evenement.key === 'Enter' && ouvert) {
      evenement.preventDefault();
      choisir(proposees[survol] ?? proposees[0]);
    }
  };

  return (
    <div className="relative" ref={conteneur}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>

      <input
        id={id}
        name="city"
        type="text"
        required
        disabled={!pays}
        autoComplete="address-level2"
        role="combobox"
        aria-expanded={ouvert}
        aria-controls={`${id}-liste`}
        aria-autocomplete="list"
        value={valeur}
        placeholder={pays ? (chargement ? '…' : placeholder) : attente}
        onChange={(evenement) => {
          onChange(evenement.target.value);
          setSurvol(0);
          setOuvert(true);
        }}
        onFocus={() => setOuvert(true)}
        onKeyDown={auClavier}
        className="w-full rounded-card border border-ink/15 bg-paper px-4 py-3.5 text-[0.9375rem] text-ink outline-none transition-all placeholder:text-muted/70 hover:border-ink/30 focus:border-gold focus:ring-4 focus:ring-gold/18 disabled:cursor-not-allowed disabled:bg-fog disabled:text-muted"
      />

      {ouvert && proposees.length > 0 && (
        <ul
          id={`${id}-liste`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-card border border-ink/15 bg-paper py-1 shadow-lift"
        >
          {proposees.map((ville, rang) => (
            <li key={ville} role="option" aria-selected={ville === valeur}>
              <button
                type="button"
                // `onMouseDown` et non `onClick` : le clic ferait d'abord
                // perdre le focus au champ, et la liste disparaîtrait avant
                // que le choix ne soit enregistré.
                onMouseDown={(evenement) => {
                  evenement.preventDefault();
                  choisir(ville);
                }}
                onMouseEnter={() => setSurvol(rang)}
                className={`block w-full px-4 py-2.5 text-left text-[0.875rem] transition-colors ${
                  rang === survol ? 'bg-mist text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {ville}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
