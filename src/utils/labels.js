import { DISASTER_TYPES } from '@/constants/disasterTypes';
import { DOUALA_ZONES } from '@/constants/doualaZones';
import { SEVERITY_LEVELS } from '@/constants/severityLevels';

const ZONES_BY_ID = Object.fromEntries(DOUALA_ZONES.map((z) => [z.id, z]));

export function zoneName(quartierId) {
  return ZONES_BY_ID[quartierId]?.name ?? quartierId;
}

export function zoneById(quartierId) {
  return ZONES_BY_ID[quartierId] ?? null;
}

export function disasterLabel(typeId) {
  return DISASTER_TYPES[typeId]?.label ?? typeId;
}

export function severityInfo(severityId) {
  return SEVERITY_LEVELS[severityId] ?? SEVERITY_LEVELS.low;
}

export function severityFromAlertLevel(level) {
  if (level === 'critical') return 'critical';
  if (level === 'warning') return 'medium';
  return 'low';
}

export function inferDisasterTypeFromSensor() {
  // Tous les capteurs actuels mesurent le risque inondation.
  return 'flood';
}
