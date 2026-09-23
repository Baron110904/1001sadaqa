/** Espace fine insécable, utilisée par Intl en français. */
const NARROW_NBSP = ' ';
/** Espace insécable ordinaire, dessinée par toutes les polices. */
const NBSP = ' ';

/**
 * En français, Intl sépare les milliers par une espace fine insécable.
 * Toutes les polices n'en ont pas le glyphe : sur les grands corps, elle
 * disparaît et « 10 000 » se lit « 10000 ». On la remplace donc par une
 * espace insécable ordinaire.
 */
function normalizeSpaces(value: string): string {
  return value.split(NARROW_NBSP).join(NBSP);
}

/**
 * Montants en francs CFA : pas de décimales, et le suffixe « F » plutôt que
 * « XOF », comme sur les maquettes.
 */
export function formatXof(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount);

  return `${normalizeSpaces(formatted)} F`;
}

export function formatNumber(value: number): string {
  return normalizeSpaces(new Intl.NumberFormat('fr-FR').format(value));
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

/** Part collectée d'une cause, bornée à 100 %. */
export function progressRatio(raised: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(1, Math.max(0, raised / goal));
}

/**
 * Découpe un texte en paragraphes. Les contenus de la base sont du texte
 * séparé par des sauts de ligne, pas du HTML : rien n'est interprété, donc
 * aucun risque d'injection.
 */
export function toParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Période d'un événement : une date, ou un intervalle.
 *
 * Quand les deux dates tombent le même mois, le mois n'est écrit qu'une fois —
 * « du 18 au 22 février 2026 » plutôt que de le répéter.
 */
export function formatDateRange(start: string | Date, end?: string | Date | null): string {
  const debut = new Date(start);
  if (!end) return formatDate(debut);

  const fin = new Date(end);
  if (Number.isNaN(fin.getTime()) || debut.toDateString() === fin.toDateString()) {
    return formatDate(debut);
  }

  const memeMois =
    debut.getFullYear() === fin.getFullYear() && debut.getMonth() === fin.getMonth();

  if (memeMois) {
    return `du ${debut.getDate()} au ${formatDate(fin)}`;
  }

  return `du ${formatDate(debut)} au ${formatDate(fin)}`;
}
