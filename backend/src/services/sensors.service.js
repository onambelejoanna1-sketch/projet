import { readDb, writeDb } from '../db/jsonStore.js';
import { makeError } from '../utils/errors.js';
import { genDisasterId, genReadingId, genSensorId } from '../utils/ids.js';
import {
  DEFAULT_THRESHOLDS,
  SENSOR_READING_TYPES,
  evaluateAlertLevel,
  isOffline,
  severityFromAlertLevel,
} from '../utils/thresholds.js';
import { DOUALA_ZONE_IDS, zoneById } from '../constants/domain.js';
import { appendActivity, buildActivityEntry } from './activity.service.js';
import { notifyEveryone } from './notifications.service.js';

const MAX_READINGS = 2000;
const AUTO_DISASTER_COOLDOWN_MS = 30 * 60 * 1000;

function enrichSensor(sensor, now = Date.now()) {
  return {
    ...sensor,
    alertLevel: evaluateAlertLevel(
      sensor.lastReading,
      sensor.thresholds || DEFAULT_THRESHOLDS,
    ),
    offline: isOffline(sensor.lastSeenAtMs, now),
  };
}

export async function listSensorsEnriched() {
  const db = await readDb();
  const now = Date.now();
  const items = db.sensors.map((s) => enrichSensor(s, now));
  return items.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export async function getSensorById(id) {
  const db = await readDb();
  const found = db.sensors.find((s) => s.id === id);
  if (!found) throw makeError('sensors/not-found', 'Capteur introuvable.');
  return enrichSensor(found);
}

export async function getSensorByDeviceId(deviceId) {
  const db = await readDb();
  return db.sensors.find((s) => s.deviceId === deviceId) || null;
}

function validateSensorPayload(input, { partial = false } = {}) {
  const fields = {};
  if (!partial || input.deviceId !== undefined) {
    if (typeof input.deviceId !== 'string' || input.deviceId.trim().length < 3) {
      throw makeError('sensors/invalid-payload', 'deviceId requis.');
    }
    fields.deviceId = input.deviceId.trim();
  }
  if (!partial || input.name !== undefined) {
    const name = String(input.name || '').trim();
    if (name.length < 2 || name.length > 80) {
      throw makeError('sensors/invalid-payload', 'Nom de capteur invalide.');
    }
    fields.name = name;
  }
  if (!partial || input.zoneId !== undefined) {
    if (!DOUALA_ZONE_IDS.includes(input.zoneId)) {
      throw makeError('sensors/invalid-payload', 'Zone invalide.');
    }
    fields.zoneId = input.zoneId;
  }
  if (!partial || input.lat !== undefined) {
    const lat = Number(input.lat);
    if (!Number.isFinite(lat)) throw makeError('sensors/invalid-payload', 'Latitude invalide.');
    fields.lat = lat;
  }
  if (!partial || input.lng !== undefined) {
    const lng = Number(input.lng);
    if (!Number.isFinite(lng)) throw makeError('sensors/invalid-payload', 'Longitude invalide.');
    fields.lng = lng;
  }
  if (input.address !== undefined) {
    fields.address = input.address == null ? null : String(input.address).trim().slice(0, 200) || null;
  }
  if (input.types !== undefined) {
    if (!Array.isArray(input.types) || input.types.some((t) => !SENSOR_READING_TYPES.includes(t))) {
      throw makeError('sensors/invalid-payload', 'Types de mesure invalides.');
    }
    fields.types = input.types;
  }
  if (input.thresholds !== undefined) {
    fields.thresholds = input.thresholds || DEFAULT_THRESHOLDS;
  }
  if (input.status !== undefined) {
    if (!['active', 'inactive', 'maintenance'].includes(input.status)) {
      throw makeError('sensors/invalid-payload', 'Statut invalide.');
    }
    fields.status = input.status;
  }
  return fields;
}

export async function createSensor(input, admin) {
  const safe = validateSensorPayload(input);
  const now = new Date().toISOString();
  const updated = await writeDb(async (db) => {
    if (db.sensors.some((s) => s.deviceId === safe.deviceId)) {
      throw makeError('sensors/duplicate-device', 'deviceId déjà utilisé.');
    }
    const seq = db.sensors.filter((s) => s.zoneId === safe.zoneId).length + 1;
    const record = {
      id: genSensorId(safe.zoneId, seq),
      deviceId: safe.deviceId,
      name: safe.name,
      zoneId: safe.zoneId,
      address: safe.address ?? null,
      lat: safe.lat,
      lng: safe.lng,
      types: safe.types || SENSOR_READING_TYPES,
      thresholds: safe.thresholds || DEFAULT_THRESHOLDS,
      status: safe.status || 'active',
      lastSeenAtMs: null,
      lastReading: null,
      createdAt: now,
      updatedAt: now,
    };
    const entry = buildActivityEntry({
      actorUid: admin.uid,
      actorName: admin.displayName || admin.email,
      action: 'create_sensor',
      targetType: 'sensor',
      targetId: record.id,
      targetTitle: record.name,
    });
    return appendActivity({ ...db, sensors: [...db.sensors, record] }, entry);
  });
  const created = updated.sensors.find((s) => s.deviceId === safe.deviceId);
  return enrichSensor(created);
}

export async function patchSensor(id, input, admin) {
  const safe = validateSensorPayload(input, { partial: true });
  const updated = await writeDb(async (db) => {
    const idx = db.sensors.findIndex((s) => s.id === id);
    if (idx === -1) throw makeError('sensors/not-found', 'Capteur introuvable.');
    if (safe.deviceId && db.sensors.some((s, i) => i !== idx && s.deviceId === safe.deviceId)) {
      throw makeError('sensors/duplicate-device', 'deviceId déjà utilisé.');
    }
    const current = db.sensors[idx];
    const next = { ...current, ...safe, updatedAt: new Date().toISOString() };
    const sensors = [...db.sensors];
    sensors[idx] = next;
    const entry = buildActivityEntry({
      actorUid: admin.uid,
      actorName: admin.displayName || admin.email,
      action: 'update_sensor',
      targetType: 'sensor',
      targetId: next.id,
      targetTitle: next.name,
    });
    return appendActivity({ ...db, sensors }, entry);
  });
  return enrichSensor(updated.sensors.find((s) => s.id === id));
}

export async function deleteSensor(id, admin) {
  await writeDb(async (db) => {
    const target = db.sensors.find((s) => s.id === id);
    if (!target) throw makeError('sensors/not-found', 'Capteur introuvable.');
    const entry = buildActivityEntry({
      actorUid: admin.uid,
      actorName: admin.displayName || admin.email,
      action: 'delete_sensor',
      targetType: 'sensor',
      targetId: target.id,
      targetTitle: target.name,
    });
    return appendActivity(
      {
        ...db,
        sensors: db.sensors.filter((s) => s.id !== id),
        sensor_readings: db.sensor_readings.filter((r) => r.sensorId !== id),
      },
      entry,
    );
  });
  return { id };
}

export async function getReadingsFor(sensorId, limit = 24) {
  const db = await readDb();
  const rows = db.sensor_readings
    .filter((r) => r.sensorId === sensorId)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, Number(limit) || 24);
  return rows.reverse();
}

export async function appendReading(deviceId, payload) {
  if (!payload || typeof payload !== 'object') {
    throw makeError('sensors/invalid-payload', 'Payload invalide.');
  }
  const readings = payload.readings;
  if (!readings || typeof readings !== 'object') {
    throw makeError('sensors/invalid-payload', 'Champ readings requis.');
  }
  for (const t of SENSOR_READING_TYPES) {
    if (readings[t] != null) {
      const v = Number(readings[t]);
      if (!Number.isFinite(v)) {
        throw makeError('sensors/invalid-payload', `Valeur ${t} invalide.`);
      }
      readings[t] = v;
    }
  }
  const batteryLevel = payload.batteryLevel != null ? Number(payload.batteryLevel) : null;
  const signalStrength = payload.signalStrength != null ? Number(payload.signalStrength) : null;

  let outcome;
  await writeDb(async (db) => {
    const sensorIdx = db.sensors.findIndex((s) => s.deviceId === deviceId);
    if (sensorIdx === -1) throw makeError('sensors/not-found', 'Capteur inconnu.');
    const sensor = db.sensors[sensorIdx];
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const thresholds = sensor.thresholds || DEFAULT_THRESHOLDS;
    const alertLevel = evaluateAlertLevel(readings, thresholds);
    const lastReading = { ...readings };
    if (batteryLevel != null) lastReading.batteryLevel = batteryLevel;

    const reading = {
      id: genReadingId(),
      sensorId: sensor.id,
      deviceId: sensor.deviceId,
      zoneId: sensor.zoneId,
      readings: { ...readings },
      batteryLevel,
      signalStrength,
      alertLevel,
      createdAt: nowIso,
    };

    const sensors = [...db.sensors];
    sensors[sensorIdx] = {
      ...sensor,
      lastSeenAtMs: nowMs,
      lastReading,
      updatedAt: nowIso,
    };

    let disasters = db.disasters;
    let activity = db.activity;
    let disasterId = null;

    const lastAutoMs = sensor.lastAutoDisasterAtMs || 0;
    const cooledDown = nowMs - lastAutoMs >= AUTO_DISASTER_COOLDOWN_MS;

    if (alertLevel === 'critical' && cooledDown) {
      const zone = zoneById(sensor.zoneId);
      const auto = {
        id: genDisasterId(),
        source: 'sensor',
        type: 'flood',
        title: `Seuil critique détecté — ${sensor.name}`,
        description: `Le capteur ${sensor.deviceId} a franchi un seuil critique.`,
        address: sensor.address || (zone ? zone.name : null),
        photoDataUrl: null,
        quartierId: sensor.zoneId,
        severity: severityFromAlertLevel(alertLevel),
        status: 'validated',
        reporterId: 'system',
        reporterName: `Capteur ${sensor.deviceId}`,
        sensorId: sensor.id,
        rawReadings: { ...readings, batteryLevel },
        validatedAt: nowIso,
        validatedBy: 'system',
        rejectionReason: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      disasters = [auto, ...disasters];
      disasterId = auto.id;
      sensors[sensorIdx] = {
        ...sensors[sensorIdx],
        lastAutoDisasterAtMs: nowMs,
      };
      const entry = buildActivityEntry({
        actorUid: 'system',
        actorName: `Capteur ${sensor.deviceId}`,
        action: 'auto_validate',
        targetType: 'disaster',
        targetId: auto.id,
        targetTitle: auto.title,
      });
      const merged = appendActivity({ ...db, activity }, entry);
      activity = merged.activity;
    }

    const trimmedReadings = [reading, ...db.sensor_readings].slice(0, MAX_READINGS);

    outcome = {
      sensor: sensors[sensorIdx],
      alertLevel,
      disasterId,
    };

    return {
      ...db,
      sensors,
      sensor_readings: trimmedReadings,
      disasters,
      activity,
    };
  });

  // Fan-out de notification quand un disaster auto a été créé (alertLevel
  // critical + cooldown passé). Le service notifyEveryone touche aussi les
  // admins (ils sont des users avec role='admin'), ce qui couvre les deux
  // populations demandées.
  if (outcome && outcome.disasterId) {
    try {
      const sensor = outcome.sensor;
      const zone = zoneById(sensor.zoneId);
      const zoneLabel = zone ? zone.name : sensor.zoneId;
      await notifyEveryone({
        type: 'sensor.critical',
        title: `Alerte capteur — ${zoneLabel}`,
        body: `Seuil critique franchi par ${sensor.name}. Restez vigilants.`,
        link: `/alertes/${outcome.disasterId}`,
        payload: {
          disasterId: outcome.disasterId,
          sensorId: sensor.id,
          zoneId: sensor.zoneId,
          alertLevel: outcome.alertLevel,
        },
      });
    } catch (err) {
      console.error('[notifications] échec fan-out capteur :', err);
    }
  }

  return outcome;
}
