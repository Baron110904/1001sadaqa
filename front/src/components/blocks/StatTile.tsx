import { Counter } from '@/components/motion/Counter';

interface StatTileProps {
  value: number;
  label: string;
  description?: string;
  suffix?: string;
  tone?: 'light' | 'gold' | 'dark';
}

const TONES = {
  light: 'bg-fog text-ink',
  gold: 'bg-gold text-ink',
  dark: 'bg-ink text-paper',
} as const;

/** Tuile de chiffre d'impact. Le nombre se compte à l'apparition. */
export function StatTile({
  value,
  label,
  description,
  suffix = '',
  tone = 'light',
}: StatTileProps) {
  return (
    <div className={`rounded-card p-5 ${TONES[tone]}`}>
      <p className="font-display text-[2rem] leading-none font-bold tracking-tight">
        <Counter value={value} suffix={suffix} />
      </p>
      <p className="mt-2.5 text-[0.8125rem] font-semibold">{label}</p>
      {description && (
        <p className={`mt-1.5 text-[0.8125rem] ${tone === 'dark' ? 'text-paper/65' : 'text-muted'}`}>
          {description}
        </p>
      )}
    </div>
  );
}
