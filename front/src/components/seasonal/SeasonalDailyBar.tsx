'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { SeasonalCampaign } from '@/lib/types';
import { calendrier } from '@/lib/seasonal';

const CLE_FERMEE = 'sadaqa.bande-du-jour';

/** Rang ordinal en français : 1ᵉʳ, puis 2ᵉ, 3ᵉ… */
function rang(jour: number): string {
  return jour === 1 ? '1ᵉʳ' : `${jour}ᵉ`;
}

/**
 * Temps qui reste avant la rupture du jeûne, en clair.
 *
 * L'heure saisie est une heure locale : on la compare à l'horloge du visiteur,
 * qui est à Cotonou dans la quasi-totalité des cas. Passée l'heure, on cesse
 * de compter à rebours et on annonce que le moment est venu — un compteur qui
 * repart de vingt-trois heures serait absurde.
 */
function rebours(heure: string, maintenant: Date): string | null {
  const [h, m] = heure.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;

  const cible = new Date(maintenant);
  cible.setHours(h, m, 0, 0);

  const minutes = Math.round((cible.getTime() - maintenant.getTime()) / 60_000);

  if (minutes <= 0) return minutes > -90 ? 'c’est l’heure de l’iftar' : 'rupture du jeûne';
  if (minutes < 60) return `dans ${minutes} min`;

  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return reste === 0 ? `dans ${heures} h` : `dans ${heures} h ${String(reste).padStart(2, '0')}`;
}

/**
 * Bande du rendez-vous du jour, fixée au bas de toutes les pages.
 *
 * Elle reste visible au défilement — c'est tout son intérêt : l'heure de
 * rupture du jeûne doit être accessible sans remonter en haut de page.
 *
 * Trois précautions :
 *
 * - la barre se referme, et le choix est retenu pour la session ; une bande
 *   qu'on ne peut pas écarter finit par gêner la lecture ;
 * - la hauteur de la barre est reportée en `padding-bottom` sur le document,
 *   sinon elle masquerait le pied de page ;
 * - le composant est client parce qu'il retient cette fermeture, mais tout
 *   son contenu vient du serveur : rien ne clignote au chargement.
 */
export function SeasonalDailyBar({ campaign }: { campaign: SeasonalCampaign }) {
  const [fermee, setFermee] = useState(false);
  const [monte, setMonte] = useState(false);
  const [reste, setReste] = useState<string | null>(null);
  const barre = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFermee(window.sessionStorage.getItem(CLE_FERMEE) === campaign.id);
    setMonte(true);
  }, [campaign.id]);

  /**
   * Compte à rebours, rafraîchi chaque minute.
   *
   * Chaque seconde ne servirait à rien — l'affichage est à la minute — et
   * réveillerait le téléphone soixante fois plus souvent pour rien.
   */
  useEffect(() => {
    if (!campaign.dailyTime) return;

    const rafraichir = () => setReste(rebours(campaign.dailyTime as string, new Date()));
    rafraichir();

    const minuterie = window.setInterval(rafraichir, 60_000);
    return () => window.clearInterval(minuterie);
  }, [campaign.dailyTime]);

  /**
   * Réserve exactement la hauteur occupée, mesurée et non devinée.
   *
   * Une valeur figée ne tenait pas : la barre s'enroule sur deux ou trois
   * lignes en petite largeur, et le pied de page se retrouvait masqué. On
   * observe donc l'élément, ce qui couvre aussi la rotation de l'écran.
   */
  useEffect(() => {
    const element = barre.current;

    if (fermee || !element) {
      document.body.style.setProperty('--bande-du-jour', '0px');
      return;
    }

    const observateur = new ResizeObserver(([entree]) => {
      document.body.style.setProperty(
        '--bande-du-jour',
        `${Math.ceil(entree.target.getBoundingClientRect().height)}px`,
      );
    });
    observateur.observe(element);

    return () => {
      observateur.disconnect();
      document.body.style.removeProperty('--bande-du-jour');
    };
  }, [fermee, monte]);

  if (fermee) return null;

  const cal = calendrier(campaign);

  return (
    <div
      ref={barre}
      className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-3 transition-transform duration-500 md:px-4 md:pb-4 ${
        monte ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="container-page">
        <div className="bg-ink-gradient relative isolate flex flex-wrap items-center gap-x-8 gap-y-3 overflow-hidden rounded-card border border-gold/25 px-5 py-4 shadow-lift">
          <div className="grain absolute inset-0" aria-hidden />

          <p className="relative min-w-0 flex-1">
            <span className="eyebrow block text-gold">
              Aujourd’hui · {rang(cal.jour)} jour
            </span>
            <span className="mt-1 block truncate font-display text-[1.0625rem] font-bold tracking-tight text-paper">
              {campaign.dailyTitle}
            </span>
          </p>

          {campaign.dailyTime && (
            <p className="relative shrink-0">
              <span className="block font-display text-[1.375rem] leading-none font-bold tracking-tight text-gold tabular">
                {campaign.dailyTime}
              </span>
              {/* Le compte à rebours n'apparaît qu'après l'affichage : calculé
                  au rendu serveur, il serait déjà faux à l'arrivée, et le
                  décalage entre les deux rendus casserait l'hydratation. */}
              <span className="mt-1 block text-[0.75rem] text-paper/55">
                {reste ? <span aria-live="polite">{reste}</span> : 'rupture du jeûne'}
              </span>
            </p>
          )}

          {campaign.dailyCount !== null && (
            <p className="relative shrink-0">
              <span className="block font-display text-[1.375rem] leading-none font-bold tracking-tight text-paper tabular">
                {campaign.dailyCount.toLocaleString('fr-FR')}
              </span>
              <span className="mt-1 block text-[0.75rem] text-paper/55">couverts prévus</span>
            </p>
          )}

          {campaign.dailyCtaLabel && (
            <Link
              // Destination fixe : la bande appelle un don, et rien d'autre.
              // L'adresse était saisissable au back-office ; c'était un
              // détail technique dans un formulaire de contenu, et une faute
              // de frappe y menait à une page absente.
              href="/communaute/donateur"
              className="relative shrink-0 rounded-full bg-gold px-5 py-3 font-display text-[0.875rem] font-semibold text-ink transition-colors hover:bg-gold-deep"
            >
              {campaign.dailyCtaLabel}
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              window.sessionStorage.setItem(CLE_FERMEE, campaign.id);
              setFermee(true);
            }}
            aria-label="Masquer la bande du jour"
            className="relative flex size-8 shrink-0 items-center justify-center rounded-full text-paper/50 transition-colors hover:bg-paper/10 hover:text-paper"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
