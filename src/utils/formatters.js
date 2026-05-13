export function formatNumber(value) {
  if (typeof value !== 'number') return value;
  return new Intl.NumberFormat('fr-FR').format(value);
}

export function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

export function truncate(text, max = 120) {
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function classNames(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
