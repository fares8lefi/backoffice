const intFmt = new Intl.NumberFormat('fr-FR');
const decFmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const tndFmt = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});
const tndShort = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' });
const monthLongFmt = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const num = (v) => Number(v ?? 0) || 0;

export const formatInt = (v) => intFmt.format(num(v));
export const formatDecimal = (v) => decFmt.format(num(v));
/** Montant exact en dinars (3 décimales, millimes) */
export const formatTND = (v) => `${tndFmt.format(num(v))} TND`;
/** Montant arrondi au dinar, pour les gros chiffres */
export const formatTNDShort = (v) => `${tndShort.format(num(v))} TND`;
export const formatPct = (v) =>
  v === null || v === undefined ? '—' : `${decFmt.format(num(v))} %`;

export const formatDate = (v) => (v ? dateFmt.format(new Date(v)) : '—');
export const formatDateTime = (v) => (v ? dateTimeFmt.format(new Date(v)) : 'Jamais');

/** "2026-03" → "mars" (ou "mars 2026" avec long) */
export const formatMonth = (key, long = false) => {
  const [y, m] = key.split('-').map(Number);
  return (long ? monthLongFmt : monthFmt).format(new Date(Date.UTC(y, m - 1, 1)));
};

const rtf = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
const UNITS = [
  ['second', 60, 1],
  ['minute', 3600, 60],
  ['hour', 86400, 3600],
  ['day', 2592000, 86400],
  ['month', 31536000, 2592000],
  ['year', Infinity, 31536000],
];

/** Temps écoulé lisible, ex. « il y a 3 jours » */
export const formatRelative = (v) => {
  if (!v) return 'Jamais';
  const diff = (new Date(v).getTime() - Date.now()) / 1000;
  const [unit, , div] = UNITS.find(([, limit]) => Math.abs(diff) < limit);
  return rtf.format(Math.round(diff / div), unit);
};
