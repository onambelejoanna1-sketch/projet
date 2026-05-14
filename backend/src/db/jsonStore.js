import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'db.json');
const TMP_PATH = path.join(DB_DIR, 'db.json.tmp');

const COLLECTIONS = [
  'users',
  'disasters',
  'sensors',
  'sensor_readings',
  'activity',
  'password_resets',
  'notifications',
  'push_subscriptions',
];

function emptyDb() {
  const db = {};
  for (const k of COLLECTIONS) db[k] = [];
  return db;
}

let writeChain = Promise.resolve();

async function ensureDir() {
  await fs.mkdir(DB_DIR, { recursive: true });
}

function normalize(parsed) {
  const safe = emptyDb();
  if (parsed && typeof parsed === 'object') {
    for (const key of COLLECTIONS) {
      if (Array.isArray(parsed[key])) safe[key] = parsed[key];
    }
  }
  return safe;
}

export async function readDb() {
  await ensureDir();
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    if (!raw.trim()) return emptyDb();
    return normalize(JSON.parse(raw));
  } catch (err) {
    if (err.code === 'ENOENT') return emptyDb();
    throw err;
  }
}

export function writeDb(updater) {
  const task = writeChain.then(async () => {
    await ensureDir();
    const current = await readDb();
    const next = normalize(await updater(current));
    const serialized = JSON.stringify(next, null, 2);
    await fs.writeFile(TMP_PATH, serialized, 'utf8');
    await fs.rename(TMP_PATH, DB_PATH);
    return next;
  });
  // On garde la chaîne vivante après un échec pour que les écritures suivantes
  // n'héritent pas du rejet, mais on logue pour ne pas perdre l'info.
  writeChain = task.catch((err) => {
    console.error('[jsonStore] échec écriture db.json :', err);
  });
  return task;
}

export async function dbExists() {
  try {
    await fs.access(DB_PATH);
    return true;
  } catch {
    return false;
  }
}

export const DB_FILE_PATH = DB_PATH;
export const DB_COLLECTIONS = COLLECTIONS;
