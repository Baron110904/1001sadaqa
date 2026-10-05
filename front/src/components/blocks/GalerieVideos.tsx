'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import type { Video } from '@/lib/types';

/**
 * Durée en secondes vers « 0:48 ».
 *
 * Les secondes sont complétées à deux chiffres : « 1:7 » se lirait comme sept
 * minutes alors qu'il s'agit d'une minute et sept secondes.
 */
function duree(secondes: number | null): string | null {
  if (secondes === null || secondes <= 0) return null;
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** « Cotonou · Mars 2026 » — le lieu et le mois, quand ils sont connus. */
function lieuEtDate(video: Video): string | null {
  const mois = video.recordedAt
    ? new Date(video.recordedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;
  const parts = [video.place, mois ? mois.charAt(0).toUpperCase() + mois.slice(1) : null];
  const texte = parts.filter(Boolean).join(' · ');
  return texte || null;
}

/**
 * La galerie des films de terrain.
 *
 * Un film occupe la place principale, les autres se présentent en vignettes
 * au-dessous ; on passe de l'un à l'autre sans quitter la page.
 *
 * Le cadre suit l'orientation du film et non l'inverse : un format unique
 * aurait cerné de bandes noires les vidéos verticales — qui sont la majorité,
 * puisqu'elles sont tournées au téléphone — ou rogné les horizontales.
 */
export function GalerieVideos({ videos }: { videos: Video[] }) {
  const [actif, setActif] = useState(0);

  if (videos.length === 0) return null;

  const video = videos[actif] ?? videos[0];
  const portrait = video.orientation === 'PORTRAIT';
  const dureeActive = duree(video.duration);
  const contexte = lieuEtDate(video);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
      {/* ── Le film en cours ── */}
      <div className={portrait ? 'mx-auto w-full max-w-[19rem]' : 'w-full'}>
        <div
          className={`relative overflow-hidden bg-ink-deep ring-1 ring-paper/15 ${
            // Le cadre téléphone est plus arrondi et plus étroit ; le cadre
            // large reprend l'arrondi des cartes du site.
            portrait ? 'aspect-[9/16] rounded-[2rem]' : 'aspect-video rounded-panel'
          }`}
        >
          <video
            // `key` force le remplacement du lecteur au changement de film :
            // sans elle, React réutilise l'élément et la vidéo précédente
            // continue d'être lue sous la nouvelle adresse.
            key={video.id}
            src={video.url}
            poster={video.poster ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="size-full object-cover"
          />
        </div>

        <p className="mt-4 text-center font-display text-[1.0625rem] font-bold text-paper lg:text-left">
          {video.title}
        </p>
        {contexte && (
          <p className="mt-1 text-center text-[0.875rem] text-paper/60 lg:text-left">{contexte}</p>
        )}
      </div>

      {/* ── Ce qu'on regarde, et le choix des autres films ── */}
      <div>
        <p className="eyebrow text-gold">À l’écran</p>

        <h3 className="mt-3 font-display text-[1.5rem] leading-tight font-bold text-paper md:text-[1.75rem]">
          {video.title}
        </h3>

        {video.description && (
          <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-paper/70">
            {video.description}
          </p>
        )}

        {video.project && (
          <p className="mt-4 text-[0.875rem] text-paper/60">
            Projet lié :{' '}
            <span className="font-semibold text-gold">{video.project.title}</span>
          </p>
        )}

        {videos.length > 1 && (
          <ul className="mt-8 flex gap-3 overflow-x-auto pb-2">
            {videos.map((autre, rang) => {
              const choisi = rang === actif;
              const d = duree(autre.duration);

              return (
                <li key={autre.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActif(rang)}
                    aria-current={choisi}
                    className={`group relative block w-28 overflow-hidden rounded-card text-left transition-all duration-300 ${
                      choisi
                        ? 'ring-2 ring-gold'
                        : 'ring-1 ring-paper/15 hover:ring-paper/40'
                    }`}
                  >
                    <span className="relative block aspect-[3/4] bg-ink-deep">
                      {autre.poster ? (
                        <Image
                          src={autre.poster}
                          alt=""
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      ) : (
                        <video
                          src={autre.url}
                          preload="metadata"
                          muted
                          playsInline
                          className="size-full object-cover"
                        />
                      )}

                      <span className="absolute inset-0 flex items-center justify-center bg-ink-deep/35 transition-colors duration-300 group-hover:bg-ink-deep/15">
                        <Play className="size-5 text-paper" fill="currentColor" aria-hidden />
                      </span>

                      {d && (
                        <span className="absolute right-1.5 bottom-1.5 rounded-full bg-ink-deep/80 px-2 py-0.5 font-display text-[0.6875rem] font-bold text-paper tabular">
                          {d}
                        </span>
                      )}
                    </span>

                    <span className="block px-2 py-2 font-display text-[0.75rem] leading-snug font-semibold text-paper/85">
                      {autre.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {dureeActive && (
          <p className="mt-4 text-[0.8125rem] text-paper/50">Durée : {dureeActive}</p>
        )}
      </div>
    </div>
  );
}
