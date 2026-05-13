import { randomUUID } from 'node:crypto';

export function genUid() {
  return 'usr-' + randomUUID();
}

export function genDisasterId() {
  return 'dis-' + randomUUID();
}

export function genSensorId(zoneId, seq) {
  if (zoneId && seq) return `s-${zoneId}-${String(seq).padStart(3, '0')}`;
  return 's-' + randomUUID();
}

export function genReadingId() {
  return 'rd-' + randomUUID();
}

export function genActivityId() {
  return 'act-' + randomUUID();
}
