import { randomUUID } from 'node:crypto';
import { readDb, writeDb } from '../db/jsonStore.js';
import { makeError } from '../utils/errors.js';
import { sendPushToUser } from './push.service.js';

// Plafond par utilisateur : on conserve l'historique des 200 dernières notifs.
const MAX_PER_USER = 200;

// ====== SSE Broker (mémoire process) ============================================
// Map<userId, Set<Response>> — chaque entrée représente un onglet/appareil connecté.
const sseConnections = new Map();
let nextConnId = 0;

export function attachSseClient(userId, res) {
  const id = ++nextConnId;
  let set = sseConnections.get(userId);
  if (!set) {
    set = new Set();
    sseConnections.set(userId, set);
  }
  const entry = { id, res };
  set.add(entry);

  // Première frame : retainer pour confirmer la connexion.
  try {
    res.write(`event: hello\ndata: ${JSON.stringify({ id, at: Date.now() })}\n\n`);
  } catch {
    // ignore — sera détaché juste après
  }

  return () => {
    const current = sseConnections.get(userId);
    if (!current) return;
    current.delete(entry);
    if (current.size === 0) sseConnections.delete(userId);
  };
}

function pushToUser(userId, notification) {
  const set = sseConnections.get(userId);
  if (!set || set.size === 0) return;
  const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
  for (const entry of set) {
    try {
      entry.res.write(payload);
    } catch {
      // connexion morte — sera nettoyée par le close handler
    }
  }
}

// ====== Création + fan-out ======================================================

function buildNotification({ userId, type, title, body, link, payload }) {
  return {
    id: 'notif-' + randomUUID(),
    userId,
    type,
    title: String(title || '').slice(0, 120),
    body: String(body || '').slice(0, 400),
    link: link || null,
    payload: payload || null,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
}

function trimByUser(notifications) {
  const byUser = new Map();
  for (const n of notifications) {
    if (!byUser.has(n.userId)) byUser.set(n.userId, []);
    byUser.get(n.userId).push(n);
  }
  const kept = [];
  for (const list of byUser.values()) {
    // garde les MAX_PER_USER plus récentes par utilisateur
    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    kept.push(...list.slice(0, MAX_PER_USER));
  }
  return kept;
}

// Crée une notification pour un seul user et la pousse via SSE + Web Push.
export async function notifyUser({ userId, type, title, body, link, payload }) {
  if (!userId) return null;
  const notif = buildNotification({ userId, type, title, body, link, payload });
  await writeDb(async (db) => {
    const next = [notif, ...(db.notifications || [])];
    return { ...db, notifications: trimByUser(next) };
  });
  pushToUser(userId, notif);
  // Dispatch OS-level (Web Push) en best-effort.
  sendPushToUser(userId, notif).catch((err) => {
    console.error('[notifications] échec sendPushToUser :', err);
  });
  return notif;
}

// Crée N notifications (une par recipient) en une seule écriture DB.
async function notifyMany({ userIds, type, title, body, link, payload }) {
  const uniq = Array.from(new Set(userIds.filter(Boolean)));
  if (uniq.length === 0) return [];
  const created = uniq.map((uid) =>
    buildNotification({ userId: uid, type, title, body, link, payload }),
  );
  await writeDb(async (db) => {
    const next = [...created, ...(db.notifications || [])];
    return { ...db, notifications: trimByUser(next) };
  });
  for (const n of created) {
    pushToUser(n.userId, n);
    sendPushToUser(n.userId, n).catch((err) => {
      console.error('[notifications] échec sendPushToUser (fan-out) :', err);
    });
  }
  return created;
}

// Fan-out à tous les admins.
export async function notifyAdmins(input) {
  const db = await readDb();
  const adminIds = db.users.filter((u) => u.role === 'admin').map((u) => u.uid);
  return notifyMany({ ...input, userIds: adminIds });
}

// Fan-out à tous les utilisateurs (toutes roles confondues).
export async function notifyEveryone(input) {
  const db = await readDb();
  const allIds = db.users.map((u) => u.uid);
  return notifyMany({ ...input, userIds: allIds });
}

// ====== Lectures côté utilisateur ===============================================

export async function listForUser(userId, { limit = 30, unreadOnly = false } = {}) {
  const db = await readDb();
  const all = (db.notifications || []).filter((n) => n.userId === userId);
  const filtered = unreadOnly ? all.filter((n) => !n.readAt) : all;
  filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const cap = Math.min(Number(limit) || 30, 100);
  return filtered.slice(0, cap);
}

export async function unreadCountFor(userId) {
  const db = await readDb();
  return (db.notifications || []).filter((n) => n.userId === userId && !n.readAt).length;
}

export async function markRead(userId, notificationId) {
  let updated = null;
  await writeDb(async (db) => {
    const list = db.notifications || [];
    const idx = list.findIndex((n) => n.id === notificationId && n.userId === userId);
    if (idx === -1) {
      throw makeError('notifications/not-found', 'Notification introuvable.');
    }
    if (list[idx].readAt) {
      updated = list[idx];
      return db;
    }
    const next = [...list];
    next[idx] = { ...list[idx], readAt: new Date().toISOString() };
    updated = next[idx];
    return { ...db, notifications: next };
  });
  return updated;
}

export async function markAllRead(userId) {
  let count = 0;
  await writeDb(async (db) => {
    const list = db.notifications || [];
    const now = new Date().toISOString();
    const next = list.map((n) => {
      if (n.userId === userId && !n.readAt) {
        count += 1;
        return { ...n, readAt: now };
      }
      return n;
    });
    return { ...db, notifications: next };
  });
  return { count };
}
