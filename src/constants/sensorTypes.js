/* Capteurs IoT pour la prévention des inondations.
   Chaque capteur ESP32 mesure 3 paramètres : niveau d'eau, pluviométrie, humidité du sol.
   Les seuils sont configurables par l'admin via l'UI. Les valeurs par défaut sont prudentes
   pour Douala (climat équatorial, saison des pluies de mars à novembre). */

export const SENSOR_TYPES = {
  water_level: {
    id: 'water_level',
    label: "Niveau d'eau",
    short: 'Eau',
    unit: '%',
    description: "Hauteur d'eau mesurée par capteur ultrason (HC-SR04) dans rivière, canal ou drain.",
    icon: '💧',
    color: '#1F6FB2',
  },
  rainfall: {
    id: 'rainfall',
    label: 'Pluviométrie',
    short: 'Pluie',
    unit: 'mm/h',
    description: "Intensité de pluie mesurée par pluviomètre à augets ou capteur YL-83.",
    icon: '🌧️',
    color: '#4A8FB8',
  },
  soil_moisture: {
    id: 'soil_moisture',
    label: 'Humidité du sol',
    short: 'Sol',
    unit: '%',
    description: "Saturation du sol mesurée par capteur capacitif. Sol saturé = risque de ruissellement.",
    icon: '🌱',
    color: '#5B7C3A',
  },
};

export const SENSOR_TYPE_LIST = Object.values(SENSOR_TYPES);

export const SENSOR_STATUSES = {
  active: { id: 'active', label: 'Actif', color: '#3F7A4D' },
  inactive: { id: 'inactive', label: 'Inactif', color: '#6B7166' },
  maintenance: { id: 'maintenance', label: 'Maintenance', color: '#B8860B' },
};

export const ALERT_LEVELS = {
  normal: { id: 'normal', label: 'Normal', color: '#3F7A4D' },
  warning: { id: 'warning', label: 'Vigilance', color: '#B8860B' },
  critical: { id: 'critical', label: 'Critique', color: '#C8102E' },
};

export const DEFAULT_THRESHOLDS = {
  water_level: { warning: 60, critical: 80 },
  rainfall: { warning: 30, critical: 60 },
  soil_moisture: { warning: 70, critical: 90 },
};

export const OFFLINE_AFTER_MS = 5 * 60 * 1000;

export function evaluateAlertLevel(readings, thresholds) {
  let level = 'normal';
  for (const type of Object.keys(thresholds)) {
    const value = readings?.[type];
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
