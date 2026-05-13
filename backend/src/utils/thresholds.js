// Logique d'évaluation des capteurs IoT — portée depuis le frontend
// (src/constants/sensorTypes.js) pour servir de source de vérité côté serveur.

export const SENSOR_READING_TYPES = ['water_level', 'rainfall', 'soil_moisture'];

export const DEFAULT_THRESHOLDS = {
  water_level: { warning: 60, critical: 80 },
  rainfall: { warning: 30, critical: 60 },
  soil_moisture: { warning: 70, critical: 90 },
};

export const OFFLINE_AFTER_MS = 5 * 60 * 1000;

export function evaluateAlertLevel(readings, thresholds = DEFAULT_THRESHOLDS) {
  if (!readings) return 'normal';
  let level = 'normal';
  for (const type of Object.keys(thresholds)) {
    const value = readings[type];
    if (value == null) continue;
    const t = thresholds[type];
    if (value >= t.critical) return 'critical';
    if (value >= t.warning) level = 'warning';
  }
  return level;
}

export function isOffline(lastSeenAtMs, now = Date.now()) {
  if (!lastSeenAtMs) return true;
  return now - lastSeenAtMs > OFFLINE_AFTER_MS;
}

export function severityFromAlertLevel(level) {
  if (level === 'critical') return 'critical';
  if (level === 'warning') return 'medium';
  return 'low';
}
