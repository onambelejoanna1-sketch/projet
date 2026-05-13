import { readDb } from '../db/jsonStore.js';
import { DEFAULT_THRESHOLDS, evaluateAlertLevel, isOffline } from '../utils/thresholds.js';
import { zoneById } from '../constants/domain.js';

// Stats macro pour la home page (alimentent la section ProblemStats).
// Ces nombres sont issus de la recherche, pas du jeu de données utilisateur.
export const PROBLEM_STATS = {
  floodIncrease: { value: 47, unit: '%', label: "d'augmentation des inondations à Douala depuis 2010." },
  highRiskZones: { value: 12, unit: '', label: "quartiers en zone d'aléa élevé identifiés par la mairie." },
  exposedInhabitants: { value: 850_000, unit: '+', label: "habitants exposés au risque inondation." },
};

function enrichSensor(s, now) {
  return {
    ...s,
    alertLevel: evaluateAlertLevel(s.lastReading, s.thresholds || DEFAULT_THRESHOLDS),
    offline: isOffline(s.lastSeenAtMs, now),
  };
}

function publicDisaster(d) {
  return {
    id: d.id,
    source: d.source,
    type: d.type,
    title: d.title,
    description: d.description,
    quartierId: d.quartierId,
    severity: d.severity,
    status: d.status,
    sensorId: d.sensorId || null,
    createdAt: d.createdAt,
    validatedAt: d.validatedAt,
  };
}

function buildLiveAlert(sensor) {
  return {
    id: `live-${sensor.id}`,
    source: 'sensor-live',
    sensorId: sensor.id,
    type: 'flood',
    title:
      sensor.alertLevel === 'critical'
        ? `Seuil critique détecté — ${sensor.name}`
        : `Vigilance renforcée — ${sensor.name}`,
    quartierId: sensor.zoneId,
    severity:
      sensor.alertLevel === 'critical'
        ? 'critical'
        : sensor.alertLevel === 'warning'
          ? 'medium'
          : 'low',
    status: 'live',
    alertLevel: sensor.alertLevel,
    lastReading: sensor.lastReading,
    createdAt: sensor.lastSeenAtMs
      ? new Date(sensor.lastSeenAtMs).toISOString()
      : new Date().toISOString(),
    validatedAt: sensor.lastSeenAtMs
      ? new Date(sensor.lastSeenAtMs).toISOString()
      : new Date().toISOString(),
  };
}

export async function getPublicFeed(limit = 6) {
  const db = await readDb();
  const now = Date.now();
  const enriched = db.sensors.map((s) => enrichSensor(s, now));
  const live = enriched
    .filter((s) => !s.offline && s.alertLevel !== 'normal')
    .map(buildLiveAlert);
  const liveSensorIds = new Set(live.map((l) => l.sensorId));
  const validated = db.disasters
    .filter((d) => d.status === 'validated')
    .filter((d) => d.source !== 'sensor' || !liveSensorIds.has(d.sensorId))
    .map(publicDisaster);
  const merged = [...live, ...validated]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, Number(limit) || 6);
  return merged;
}

export async function getPublicTicker(limit = 6) {
  const feed = await getPublicFeed(limit);
  return feed.map((item) => {
    const zone = zoneById(item.quartierId);
    return {
      id: item.id,
      kind: item.type,
      severity: item.severity,
      zone: zone ? zone.name : item.quartierId,
      time: item.createdAt,
      title: item.title,
    };
  });
}

export async function getPublicStats() {
  return PROBLEM_STATS;
}

export async function listPublicSensors() {
  const db = await readDb();
  const now = Date.now();
  return db.sensors
    .map((s) => enrichSensor(s, now))
    .map((s) => ({
      id: s.id,
      deviceId: s.deviceId,
      name: s.name,
      zoneId: s.zoneId,
      lat: s.lat,
      lng: s.lng,
      types: s.types,
      status: s.status,
      alertLevel: s.alertLevel,
      offline: s.offline,
      lastReading: s.lastReading,
      lastSeenAtMs: s.lastSeenAtMs,
    }));
}
