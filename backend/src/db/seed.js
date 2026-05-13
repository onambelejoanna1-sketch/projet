import bcrypt from 'bcryptjs';
import { readDb, writeDb, dbExists, DB_FILE_PATH } from './jsonStore.js';
import { env } from '../config/env.js';
import { DEFAULT_THRESHOLDS } from '../utils/thresholds.js';

const SEED_USERS = [
  {
    uid: 'seed-admin-001',
    email: 'admin@test.com',
    plainPassword: '12345678',
    displayName: 'Admin Demo',
    role: 'admin',
    fcmTokens: [],
    notificationPrefs: { enabled: false, zones: [] },
    reportsCount: 0,
    createdAt: '2025-01-01T08:00:00.000Z',
  },
  {
    uid: 'seed-user-001',
    email: 'user@test.com',
    plainPassword: '12345678',
    displayName: 'Client Demo',
    role: 'user',
    fcmTokens: [],
    notificationPrefs: { enabled: false, zones: [] },
    reportsCount: 0,
    createdAt: '2025-02-15T10:30:00.000Z',
  },
];

const MIN = 60_000;

function seedSensors(nowMs = Date.now()) {
  const nowIso = new Date(nowMs).toISOString();
  return [
    {
      id: 's-akwa-001',
      deviceId: 'ESP32-AKWA-001',
      name: 'Capteur pont Akwa',
      zoneId: 'akwa',
      address: 'Pont Akwa, rue de la Joss',
      lat: 4.0469,
      lng: 9.7034,
      types: ['water_level', 'rainfall', 'soil_moisture'],
      thresholds: DEFAULT_THRESHOLDS,
      status: 'active',
      lastSeenAtMs: nowMs - 1 * MIN,
      lastReading: { water_level: 52, rainfall: 18, soil_moisture: 64, batteryLevel: 87 },
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 's-bonaberi-001',
      deviceId: 'ESP32-BONABERI-001',
      name: 'Capteur drain Bonabéri',
      zoneId: 'bonaberi',
      address: 'Carrefour Bonabéri',
      lat: 4.0822,
      lng: 9.6622,
      types: ['water_level', 'rainfall', 'soil_moisture'],
      thresholds: DEFAULT_THRESHOLDS,
      status: 'active',
      lastSeenAtMs: nowMs - 2 * MIN,
      lastReading: { water_level: 84, rainfall: 62, soil_moisture: 92, batteryLevel: 73 },
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 's-newbell-001',
      deviceId: 'ESP32-NEWBELL-001',
      name: 'Capteur marché New Bell',
      zoneId: 'new-bell',
      address: 'Marché central New Bell',
      lat: 4.0426,
      lng: 9.7244,
      types: ['water_level', 'rainfall', 'soil_moisture'],
      thresholds: DEFAULT_THRESHOLDS,
      status: 'active',
      lastSeenAtMs: nowMs - 1 * MIN,
      lastReading: { water_level: 68, rainfall: 35, soil_moisture: 75, batteryLevel: 91 },
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 's-bepanda-001',
      deviceId: 'ESP32-BEPANDA-001',
      name: 'Capteur caniveau Bépanda',
      zoneId: 'bepanda',
      address: 'Caniveau central Bépanda',
      lat: 4.07,
      lng: 9.74,
      types: ['water_level', 'rainfall', 'soil_moisture'],
      thresholds: DEFAULT_THRESHOLDS,
      status: 'active',
      lastSeenAtMs: nowMs - 3 * MIN,
      lastReading: { water_level: 41, rainfall: 12, soil_moisture: 58, batteryLevel: 64 },
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 's-ndogpassi-001',
      deviceId: 'ESP32-NDOGPASSI-001',
      name: 'Capteur Ndogpassi',
      zoneId: 'ndogpassi',
      address: 'Carrefour Ndogpassi',
      lat: 4.075,
      lng: 9.78,
      types: ['water_level', 'rainfall', 'soil_moisture'],
      thresholds: DEFAULT_THRESHOLDS,
      status: 'maintenance',
      lastSeenAtMs: nowMs - 4 * 60 * MIN,
      lastReading: { water_level: 0, rainfall: 0, soil_moisture: 0, batteryLevel: 22 },
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 's-makepe-001',
      deviceId: 'ESP32-MAKEPE-001',
      name: 'Capteur Makepè',
      zoneId: 'makepe',
      address: 'Makepè missokè',
      lat: 4.0717,
      lng: 9.7531,
      types: ['water_level', 'rainfall', 'soil_moisture'],
      thresholds: DEFAULT_THRESHOLDS,
      status: 'active',
      lastSeenAtMs: nowMs - 1 * MIN,
      lastReading: { water_level: 30, rainfall: 8, soil_moisture: 52, batteryLevel: 95 },
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}

async function buildSeedUser(spec) {
  const password = await bcrypt.hash(spec.plainPassword, env.bcryptRounds);
  const { plainPassword: _omit, ...rest } = spec;
  return { ...rest, password };
}

export async function ensureSeeded() {
  const exists = await dbExists();
  let users = [];
  let sensors = [];
  let needWrite = false;

  if (exists) {
    const db = await readDb();
    users = db.users || [];
    sensors = db.sensors || [];
  }

  if (users.length === 0) {
    users = await Promise.all(SEED_USERS.map(buildSeedUser));
    needWrite = true;
  }
  if (sensors.length === 0) {
    sensors = seedSensors();
    needWrite = true;
  }

  if (needWrite) {
    await writeDb(async (db) => ({
      ...db,
      users: db.users.length === 0 ? users : db.users,
      sensors: db.sensors.length === 0 ? sensors : db.sensors,
    }));
    return { seeded: true, usersCount: users.length, sensorsCount: sensors.length };
  }
  return { seeded: false, usersCount: users.length, sensorsCount: sensors.length };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.js')) {
  ensureSeeded()
    .then((res) => {
      if (res.seeded) {
        console.log(
          `[seed] ${res.usersCount} utilisateur(s) + ${res.sensorsCount} capteur(s) ajoutés à ${DB_FILE_PATH}`,
        );
      } else {
        console.log(
          `[seed] base déjà initialisée (${res.usersCount} utilisateurs, ${res.sensorsCount} capteurs) — aucun changement.`,
        );
      }
    })
    .catch((err) => {
      console.error('[seed] échec :', err);
      process.exit(1);
    });
}
