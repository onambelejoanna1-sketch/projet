import { DOUALA_ZONES } from '@/constants/doualaZones';

export const RISK_LEVELS = {
  high: { id: 'high', label: 'Élevé', color: '#C8102E', textColor: '#FAF6F0' },
  medium: { id: 'medium', label: 'Moyen', color: '#E5572E', textColor: '#FAF6F0' },
  low: { id: 'low', label: 'Faible', color: '#F4C430', textColor: '#1A1A1A' },
  none: { id: 'none', label: 'Calme', color: '#6B7166', textColor: '#FAF6F0' },
};

const HIGH_SEVERITIES = new Set(['critical', 'high']);

function isReportActive(report) {
  return report.status !== 'rejected';
}

function isSensorContributing(sensor) {
  return !sensor.offline && sensor.status !== 'maintenance';
}

export function getZoneRiskLevel(
  zoneId,
  { sensors = [], reports = [], alerts = [] } = {},
) {
  const zoneSensors = sensors.filter(
    (s) => s.zoneId === zoneId && isSensorContributing(s),
  );
  const zoneReports = reports.filter(
    (r) => r.quartierId === zoneId && isReportActive(r),
  );
  const zoneAlerts = alerts.filter((a) => a.quartierId === zoneId);

  const sensorCount = zoneSensors.length;
  const reportCount = zoneReports.length;
  const alertCount = zoneAlerts.length;

  const hasCriticalSensor = zoneSensors.some((s) => s.alertLevel === 'critical');
  const hasWarningSensor = zoneSensors.some((s) => s.alertLevel === 'warning');

  const hasHighReport = zoneReports.some((r) => HIGH_SEVERITIES.has(r.severity));
  const hasMediumReport = zoneReports.some((r) => r.severity === 'medium');
  const hasLowReport = zoneReports.some((r) => r.severity === 'low');

  const hasHighAlert = zoneAlerts.some((a) => HIGH_SEVERITIES.has(a.severity));
  const hasMediumAlert = zoneAlerts.some((a) => a.severity === 'medium');

  let level = 'none';
  if (hasCriticalSensor || hasHighReport || hasHighAlert) {
    level = 'high';
  } else if (hasWarningSensor || hasMediumReport || hasMediumAlert) {
    level = 'medium';
  } else if (hasLowReport || sensorCount > 0 || reportCount > 0 || alertCount > 0) {
    level = 'low';
  }

  const meta = RISK_LEVELS[level];

  return {
    level,
    color: meta.color,
    textColor: meta.textColor,
    label: meta.label,
    sensorCount,
    reportCount,
    alertCount,
  };
}

export function getAllZonesWithRisk({ sensors = [], reports = [], alerts = [] } = {}) {
  return DOUALA_ZONES.map((zone) => ({
    ...zone,
    risk: getZoneRiskLevel(zone.id, { sensors, reports, alerts }),
  }));
}

const LEVEL_RANK = { high: 3, medium: 2, low: 1, none: 0 };

export function compareByRisk(a, b) {
  return LEVEL_RANK[b.risk.level] - LEVEL_RANK[a.risk.level];
}

export function countZonesByRisk(zonesWithRisk) {
  return zonesWithRisk.reduce(
    (acc, z) => {
      acc[z.risk.level] = (acc[z.risk.level] ?? 0) + 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0, none: 0 },
  );
}
