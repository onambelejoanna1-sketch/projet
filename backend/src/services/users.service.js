import { readDb, writeDb } from '../db/jsonStore.js';
import { makeError } from '../utils/errors.js';
import { publicUser } from '../utils/publicUser.js';

export async function getUserById(uid) {
  const db = await readDb();
  const found = db.users.find((u) => u.uid === uid);
  if (!found) throw makeError('auth/user-not-found', 'Utilisateur introuvable.');
  return publicUser(found);
}

export async function deleteUserByUid(uid, { requesterUid } = {}) {
  if (!uid) throw makeError('auth/user-not-found', 'Utilisateur introuvable.');
  if (uid === requesterUid) {
    throw makeError('auth/forbidden', 'Vous ne pouvez pas supprimer votre propre compte.');
  }
  await writeDb(async (db) => {
    const target = db.users.find((u) => u.uid === uid);
    if (!target) throw makeError('auth/user-not-found', 'Utilisateur introuvable.');
    if (target.role === 'admin') {
      const adminCount = db.users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        throw makeError(
          'auth/forbidden',
          'Impossible de supprimer le dernier administrateur.',
        );
      }
    }
    return { ...db, users: db.users.filter((u) => u.uid !== uid) };
  });
  return { uid };
}

export async function listAllUsers() {
  const db = await readDb();
  return db.users.map(publicUser);
}

export async function patchUserProfile(uid, patch) {
  const allowed = ['displayName'];
  const safePatch = {};
  for (const key of allowed) {
    if (patch && Object.prototype.hasOwnProperty.call(patch, key)) {
      safePatch[key] = patch[key];
    }
  }
  if (safePatch.displayName !== undefined) {
    const trimmed = String(safePatch.displayName).trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      throw makeError('auth/invalid-display-name', 'Le nom doit contenir entre 2 et 60 caractères.');
    }
    safePatch.displayName = trimmed;
  }
  const updated = await writeDb(async (db) => {
    const idx = db.users.findIndex((u) => u.uid === uid);
    if (idx === -1) throw makeError('auth/user-not-found', 'Utilisateur introuvable.');
    const merged = { ...db.users[idx], ...safePatch };
    const users = [...db.users];
    users[idx] = merged;
    return { ...db, users };
  });
  return publicUser(updated.users.find((u) => u.uid === uid));
}

export async function updateNotificationPrefs(uid, prefs) {
  const updated = await writeDb(async (db) => {
    const idx = db.users.findIndex((u) => u.uid === uid);
    if (idx === -1) throw makeError('auth/user-not-found', 'Utilisateur introuvable.');
    const current = db.users[idx];
    const nextPrefs = {
      ...current.notificationPrefs,
      ...(typeof prefs?.enabled === 'boolean' ? { enabled: prefs.enabled } : {}),
      ...(Array.isArray(prefs?.zones) ? { zones: prefs.zones } : {}),
    };
    const users = [...db.users];
    users[idx] = { ...current, notificationPrefs: nextPrefs };
    return { ...db, users };
  });
  return publicUser(updated.users.find((u) => u.uid === uid));
}

export async function addFcmToken(uid, token) {
  if (!token || typeof token !== 'string') {
    throw makeError('auth/missing-fields', 'Token FCM requis.');
  }
  const updated = await writeDb(async (db) => {
    const idx = db.users.findIndex((u) => u.uid === uid);
    if (idx === -1) throw makeError('auth/user-not-found', 'Utilisateur introuvable.');
    const current = db.users[idx];
    const tokens = Array.isArray(current.fcmTokens) ? current.fcmTokens : [];
    if (tokens.includes(token)) return db;
    const users = [...db.users];
    users[idx] = {
      ...current,
      fcmTokens: [...tokens, token],
      notificationPrefs: { ...current.notificationPrefs, enabled: true },
    };
    return { ...db, users };
  });
  return publicUser(updated.users.find((u) => u.uid === uid));
}

export async function removeFcmToken(uid, token) {
  if (!token || typeof token !== 'string') {
    throw makeError('auth/missing-fields', 'Token FCM requis.');
  }
  const updated = await writeDb(async (db) => {
    const idx = db.users.findIndex((u) => u.uid === uid);
    if (idx === -1) throw makeError('auth/user-not-found', 'Utilisateur introuvable.');
    const current = db.users[idx];
    const users = [...db.users];
    users[idx] = {
      ...current,
      fcmTokens: (current.fcmTokens || []).filter((t) => t !== token),
    };
    return { ...db, users };
  });
  return publicUser(updated.users.find((u) => u.uid === uid));
}
