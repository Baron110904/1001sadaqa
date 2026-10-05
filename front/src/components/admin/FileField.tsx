'use client';

import Image from 'next/image';
import { useRef, useState, useTransition } from 'react';
import { FileText, ImageOff, Trash2, Upload } from 'lucide-react';
import { uploadFile } from '@/app/admin/actions';

interface FileFieldProps {
  id: string;
  name: string;
  label: string;
  /** Adresse déjà enregistrée, en modification. */
  value: string;
  /** Rangement du fichier dans le stockage. */
  bucket: string;
  required?: boolean;
  disabled?: boolean;
  /** `document` accepte les PDF et affiche une icône au lieu d'un aperçu. */
  variant?: 'image' | 'document' | 'video';
  /**
   * Champ numérique du même formulaire à renseigner avec la durée du film.
   *
   * Le fichier porte sa durée : la faire relever par le navigateur évite de
   * demander à l'équipe de chronométrer ses vidéos pour afficher « 0:48 ».
   */
  fillsDuration?: string;
}

const ACCEPT = {
  image: 'image/jpeg,image/png,image/webp,image/avif,image/svg+xml',
  document: 'application/pdf',
  video: 'video/mp4,video/quicktime,video/webm',
} as const;

/**
 * Plafond du stockage, en octets. Voir `MAX_BYTES` dans media.service.ts.
 *
 * Les films ont le leur : 25 Mo refusaient à peu près toute vidéo de terrain,
 * une minute filmée au téléphone pesant couramment plus du double.
 */
const TAILLE_MAX = 25 * 1024 * 1024;
const TAILLE_MAX_VIDEO = 200 * 1024 * 1024;

function poidsLisible(octets: number): string {
  const mo = octets / (1024 * 1024);
  return mo >= 1 ? `${mo.toFixed(1).replace('.', ',')} Mo` : `${Math.round(octets / 1024)} Ko`;
}

/**
 * Champ de fichier des formulaires de contenu.
 *
 * L'équipe choisit un fichier sur son poste ; il part au stockage et son
 * adresse est renseignée automatiquement dans le champ caché que le
 * formulaire enregistrera. L'aperçu confirme le bon fichier avant
 * l'enregistrement.
 */
export function FileField({
  id,
  name,
  label,
  value,
  bucket,
  required,
  disabled,
  variant = 'image',
  fillsDuration,
}: FileFieldProps) {
  const [url, setUrl] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  /**
   * Relève la durée du film et la porte dans le champ voisin.
   *
   * Le fichier n'a pas besoin d'être envoyé pour cela : le navigateur lit ses
   * métadonnées depuis le poste. En cas d'échec — format exotique, fichier
   * abîmé — on ne dit rien et le champ reste saisissable à la main.
   */
  const releverLaDuree = (file: File) => {
    if (!fillsDuration) return;

    const lecteur = document.createElement('video');
    const adresse = URL.createObjectURL(file);

    lecteur.onloadedmetadata = () => {
      const secondes = Math.round(lecteur.duration);
      const cible = input.current?.form?.elements.namedItem(fillsDuration);
      if (Number.isFinite(secondes) && cible instanceof HTMLInputElement) {
        cible.value = String(secondes);
      }
      URL.revokeObjectURL(adresse);
    };
    lecteur.onerror = () => URL.revokeObjectURL(adresse);
    lecteur.src = adresse;
  };

  const send = (file: File) => {
    setError(null);

    // Un fichier trop lourd est écarté ici : l'envoyer quand même faisait
    // échouer l'action serveur, ce qui casse la page au lieu de l'expliquer.
    const plafond = variant === 'video' ? TAILLE_MAX_VIDEO : TAILLE_MAX;
    if (file.size > plafond) {
      setError(
        `Ce fichier pèse ${poidsLisible(file.size)}. La limite est de ${Math.round(plafond / 1024 / 1024)} Mo - réduisez-le avant de l’envoyer.`,
      );
      return;
    }

    releverLaDuree(file);

    const form = new FormData();
    form.append('file', file);
    form.append('bucket', bucket);

    start(async () => {
      const result = await uploadFile(form);
      if (result.ok && result.url) {
        setUrl(result.url);
        setBroken(false);
      } else {
        setError(result.message ?? "L'envoi a échoué.");
      }
    });
  };

  const isImage = variant === 'image';

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>

      {/* La valeur enregistrée est l'adresse, pas le fichier : c'est ce champ
          que le formulaire transmet. */}
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-wrap items-center gap-4">
        <span className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-card border border-ink/10 bg-sand">
          {url && !broken ? (
            isImage ? (
              <Image
                src={url}
                alt=""
                fill
                sizes="96px"
                className="object-contain"
                onError={() => setBroken(true)}
              />
            ) : variant === 'video' ? (
              // La première image du film suffit à reconnaître le bon fichier,
              // et `preload="metadata"` évite de rapatrier les 200 Mo pour
              // l'obtenir.
              <video
                src={url}
                preload="metadata"
                muted
                playsInline
                className="size-full object-cover"
                onError={() => setBroken(true)}
              />
            ) : (
              <FileText className="size-7 text-leaf" aria-hidden />
            )
          ) : (
            <ImageOff className="size-5 text-ink/25" aria-hidden />
          )}
        </span>

        <div className="flex flex-col gap-2">
          <input
            ref={input}
            id={id}
            type="file"
            accept={ACCEPT[variant]}
            disabled={disabled || pending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) send(file);
            }}
            className="sr-only"
          />

          <span className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={disabled || pending}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 font-display text-[0.8125rem] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-mist disabled:opacity-55"
            >
              <Upload className="size-3.5" aria-hidden />
              {pending ? 'Envoi…' : url ? 'Remplacer' : 'Choisir un fichier'}
            </button>

            {url && !pending && (
              <button
                type="button"
                onClick={() => {
                  setUrl('');
                  setBroken(false);
                  if (input.current) input.current.value = '';
                }}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-2 font-display text-[0.8125rem] font-semibold text-muted transition-colors hover:border-red-600/40 hover:bg-red-50 hover:text-red-800"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Retirer
              </button>
            )}
          </span>

          {error ? (
            <p role="alert" className="text-[0.8125rem] text-red-700">
              {error}
            </p>
          ) : url ? (
            <p className="max-w-xs truncate text-[0.8125rem] text-muted">
              {url.split('/').pop()}
            </p>
          ) : (
            required && <p className="text-[0.8125rem] text-muted">Fichier obligatoire.</p>
          )}
        </div>
      </div>
    </div>
  );
}
