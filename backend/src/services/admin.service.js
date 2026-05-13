import { readDb } from '../db/jsonStore.js';
import { DEFAULT_THRESHOLDS, evaluateAlertLevel, isOffline } from '../utils/thresholds.js';

function startOfToday() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function enrichSensor(sensor, now) {
  return {
    ...sensor,
    alertLevel: evaluateAlertLevel(
      sensor.lastReading,
      sensor.thresholds || DEFAULT_THRESHOLDS,
    ),
    offline: isOffline(sensor.lastSeenAtMs, now),
  };
}

export async function getStats() {
  const db = await readDb();
  const today = startOfToday();
  const totalReports = db.disasters.length;
  const pending = db.disasters.filter((d) => d.status === 'pending').length;
  const validatedToday = db.disasters.filter(
    (d) =>
      d.status === 'validated' &&
      d.validatedAt &&
      new Date(d.validatedAt).getTime() >= today,
  ).length;
  const users = db.users.length;
  const now = Date.now();
  const enriched = db.sensors.map((s) => enrichSensor(s, now));
  const active = enriched.filter((s) => s.status === 'active' && !s.offline).length;
  const inAlert = enriched.filter((s) => s.alertLevel !== 'normal' && !s.offline).length;
  const offline = enriched.filter((s) => s.offline).length;
  return {
    reports: { totalReports, pending, validatedToday, users },
    sensors: { total: enriched.length, active, inAlert, offline },
  };
}

export async function listActivity(limit = 20) {
  const db = await readDb();
  return [...db.activity]
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, Number(limit) || 20);
}

export async function listTopZones({ days = 30, limit = 5 } = {}) {
  const db = await readDb();
  const cutoff = Date.now() - Number(days) * 24 * 60 * 60 * 1000;
  const counts = new Map();
  for (const d of db.disasters) {
    if (d.status === 'rejected') continue;
    const t = new Date(d.createdAt).getTime();
    if (Number.isFinite(t) && t < cutoff) continue;
    counts.set(d.quartierId, (counts.get(d.quartierId) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([quartierId, count]) => ({ quartierId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, Number(limit) || 5);
}

function buildLiveSensorAlert(sensor) {
  const severity =
    sensor.alertLevel === 'critical'
      ? 'critical'
      : sensor.alertLevel === 'warning'
        ? 'medium'
        : 'low';
  const title =
    sensor.alertLevel === 'critical'
      ? `Seuil critique détecté — ${sensor.name}`
      : `Vigilance renforcée — ${sensor.name}`;
  return {
    id: `live-${sensor.id}`,
    source: 'sensor-live',
    sensorId: sensor.id,
    type: 'flood',
    title,
    quartierId: sensor.zoneId,
    severity,
    status: 'live',
    reporterId: 'system',
    reporterName: sensor.deviceId,
    alertLevel: sensor.alertLevel,
    lastReading: sensor.lastReading,
    createdAt: sensor.lastSeenAtMs
      ? new Date(sensor.lastSeenAtMs).toISOString()
      : new Date().toISOString(),
    validatedAt: sensor.lastSeenAtMs
      ? new Date(sensor.lastSeenAtMs).toISOString()
      : new Date().toISOString(),
    validatedBy: 'system',
  };
}

export async function getAlertsBuckets() {
  const db = await readDb();
  const now = Date.now();
  const enrichedSensors = db.sensors.map((s) => enrichSensor(s, now));

  const sensorsLive = enrichedSensors
    .filter((s) => !s.offline && s.alertLevel !== 'normal')
    .map(buildLiveSensorAlert);
  const liveSensorIds = new Set(sensorsLive.map((a) => a.sensorId));

  const pending = db.disasters
    .filter((d) => d.status === 'pending')
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const validatedAll = db.disasters
    .filter((d) => d.status === 'validated')
    .sort(
      (a, b) =>
        new Date(b.validatedAt || b.createdAt).getTime() -
        new Date(a.validatedAt || a.createdAt).getTime(),
    );

  // Déduplication : si un capteur est live, son historique récent est masqué
  // pour ne pas dupliquer l'alerte dans le bucket validated.
  const validated = validatedAll.filter(
    (d) => d.source !== 'sensor' || !liveSensorIds.has(d.sensorId),
  );

  const rejected = db.disasters
    .filter((d) => d.status === 'rejected')
    .sort(
      (a, b) =>
        new Date(b.validatedAt || b.createdAt).getTime() -
        new Date(a.validatedAt || a.createdAt).getTime(),
    );

  const all = [...sensorsLive, ...pending, ...validated, ...rejected].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return { pending, validated, rejected, sensorsLive, all };
}
