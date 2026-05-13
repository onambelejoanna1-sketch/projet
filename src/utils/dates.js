import { formatDistanceToNowStrict, format } from 'date-fns';
import { fr } from 'date-fns/locale';

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'number' || typeof value === 'string') return new Date(value);
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

export function formatRelative(value) {
  const date = toDate(value);
  if (!date) return '';
  return formatDistanceToNowStrict(date, { locale: fr, addSuffix: true });
}

export function formatRelativeMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export function timeSinceISO(iso) {
  if (!iso) return '';
  const date = toDate(iso);
  if (!date) return '';
  const ms = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(ms / 60000));
  return formatRelativeMinutes(minutes);
}

export function minutesAgo(iso) {
  if (!iso) return 0;
  const date = toDate(iso);
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
}

export function formatDateTime(value, pattern = "d MMM yyyy 'à' HH:mm") {
  const date = toDate(value);
  if (!date) return '';
  return format(date, pattern, { locale: fr });
}

export function formatTime(value, pattern = 'HH:mm') {
  const date = toDate(value);
  if (!date) return '';
  return format(date, pattern, { locale: fr });
}
