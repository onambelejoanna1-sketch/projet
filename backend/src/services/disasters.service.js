import { readDb, writeDb } from '../db/jsonStore.js';
import { makeError } from '../utils/errors.js';
import { genDisasterId } from '../utils/ids.js';
import {
  validateNewDisaster,
  validateRejectReason,
} from '../validators/disasters.validators.js';
import { appendActivity, buildActivityEntry } from './activity.service.js';
import { notifyUser } from './notifications.service.js';

function findUser(db, uid) {
  return db.users.find((u) => u.uid === uid) || null;
}

function findIndex(db, id) {
  return db.disasters.findIndex((d) => d.id === id);
}

function ensureExists(db, id) {
  const idx = findIndex(db, id);
  if (idx === -1) throw makeError('disasters/not-found', 'Signalement introuvable.');
  return idx;
}

export async function createDisaster(input, reporter) {
  const safe = validateNewDisaster(input);
  const now = new Date().toISOString();
  const record = {
    id: genDisasterId(),
    source: 'user',
    type: safe.type,
    title: safe.title,
    description: safe.description,
    address: safe.address,
    photoDataUrl: safe.photoDataUrl,
    quartierId: safe.quartierId,
    severity: safe.severity,
    status: 'pending',
    reporterId: reporter.uid,
    reporterName: reporter.displayName || reporter.email || 'Sentinelle',
    sensorId: null,
    rawReadings: null,
    validatedAt: null,
    validatedBy: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  };
  await writeDb(async (db) => {
    const usersIdx = db.users.findIndex((u) => u.uid === reporter.uid);
    const users = [...db.users];
    if (usersIdx !== -1) {
      const current = users[usersIdx];
      users[usersIdx] = {
        ...current,
        reportsCount: (current.reportsCount || 0) + 1,
      };
    }
    return { ...db, users, disasters: [record, ...db.disasters] };
  });
  return record;
}

export async function listDisasters(filters = {}) {
  const db = await readDb();
  const { status, reporterId, quartierId, type, severity, source, limit } = filters;
  let rows = db.disasters;
  if (status) {
    const wanted = String(status).split(',').filter(Boolean);
    rows = rows.filter((d) => wanted.includes(d.status));
  }
  if (reporterId) rows = rows.filter((d) => d.reporterId === reporterId);
  if (quartierId) rows = rows.filter((d) => d.quartierId === quartierId);
  if (type) rows = rows.filter((d) => d.type === type);
  if (severity) rows = rows.filter((d) => d.severity === severity);
  if (source) rows = rows.filter((d) => d.source === source);
  rows = [...rows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  if (limit) rows = rows.slice(0, Number(limit));
  return rows;
}

export async function getDisaster(id) {
  const db = await readDb();
  const found = db.disasters.find((d) => d.id === id);
  if (!found) throw makeError('disasters/not-found', 'Signalement introuvable.');
  return found;
}

export async function validateDisaster(id, admin) {
  const updated = await writeDb(async (db) => {
    const idx = ensureExists(db, id);
    const current = db.disasters[idx];
    const now = new Date().toISOString();
    const next = {
      ...current,
      status: 'validated',
      validatedAt: now,
      validatedBy: admin.uid,
      rejectionReason: null,
      updatedAt: now,
    };
    const disasters = [...db.disasters];
    disasters[idx] = next;
    const entry = buildActivityEntry({
      actorUid: admin.uid,
      actorName: admin.displayName || admin.email,
      action: 'validate',
      targetType: 'disaster',
      targetId: next.id,
      targetTitle: next.title,
    });
    return appendActivity({ ...db, disasters }, entry);
  });
  const result = updated.disasters.find((d) => d.id === id);
  // Notifier l'auteur (sauf si c'est un disaster auto-créé par un capteur).
  if (result && result.reporterId && result.reporterId !== 'system') {
    try {
      await notifyUser({
        userId: result.reporterId,
        type: 'disaster.validated',
        title: 'Votre signalement a été validé',
        body: `« ${result.title} » est désormais visible publiquement.`,
        link: `/alertes/${result.id}`,
        payload: { disasterId: result.id, severity: result.severity },
      });
    } catch (err) {
      console.error('[notifications] échec notification validation :', err);
    }
  }
  return result;
}

export async function rejectDisaster(id, admin, reasonInput) {
  const reason = validateRejectReason(reasonInput);
  const updated = await writeDb(async (db) => {
    const idx = ensureExists(db, id);
    const current = db.disasters[idx];
    const now = new Date().toISOString();
    const next = {
      ...current,
      status: 'rejected',
      validatedAt: now,
      validatedBy: admin.uid,
      rejectionReason: reason,
      updatedAt: now,
    };
    const disasters = [...db.disasters];
    disasters[idx] = next;
    const entry = buildActivityEntry({
      actorUid: admin.uid,
      actorName: admin.displayName || admin.email,
      action: 'reject',
      targetType: 'disaster',
      targetId: next.id,
      targetTitle: next.title,
    });
    return appendActivity({ ...db, disasters }, entry);
  });
  const result = updated.disasters.find((d) => d.id === id);
  if (result && result.reporterId && result.reporterId !== 'system') {
    try {
      await notifyUser({
        userId: result.reporterId,
        type: 'disaster.rejected',
        title: 'Votre signalement a été rejeté',
        body: `« ${result.title} » : ${reason}`,
        link: `/tableau-de-bord`,
        payload: { disasterId: result.id, reason },
      });
    } catch (err) {
      console.error('[notifications] échec notification rejet :', err);
    }
  }
  return result;
}

export async function deleteDisaster(id, admin) {
  await writeDb(async (db) => {
    const idx = ensureExists(db, id);
    const target = db.disasters[idx];
    const disasters = db.disasters.filter((d) => d.id !== id);
    const entry = buildActivityEntry({
      actorUid: admin.uid,
      actorName: admin.displayName || admin.email,
      action: 'delete',
      targetType: 'disaster',
      targetId: target.id,
      targetTitle: target.title,
    });
    return appendActivity({ ...db, disasters }, entry);
  });
  return { id };
}

// Surface utilisée par le service capteurs pour créer un disaster auto sans relancer
// les validateurs (les champs sont déjà construits à partir d'une lecture critique).
export async function insertAutoDisaster(record) {
  await writeDb(async (db) => ({ ...db, disasters: [record, ...db.disasters] }));
  return record;
}

export function findUserByUid(db, uid) {
  return findUser(db, uid);
}
