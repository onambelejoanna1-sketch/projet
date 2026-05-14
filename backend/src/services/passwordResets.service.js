import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { readDb, writeDb } from '../db/jsonStore.js';
import { makeError } from '../utils/errors.js';
import {
  normalizeEmail,
  validatePassword,
} from '../validators/auth.validators.js';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure
const MAX_RESETS_PER_USER = 3;       // garde-fou : on conserve au plus 3 tokens actifs par compte

function generateToken() {
  return randomBytes(32).toString('hex');
}

function pruneExpired(resets, nowMs) {
  return resets.filter((r) => !r.usedAt && r.expiresAtMs > nowMs);
}

// Crée un token de reset si l'email correspond à un compte. La réponse est
// volontairement la même que l'email existe ou pas (anti-énumération).
// En dev (NODE_ENV !== 'production'), le token est aussi renvoyé pour que le flow
// soit testable sans SMTP. À retirer le jour où un envoi d'email est branché.
export async function requestPasswordReset(rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    // Réponse identique pour ne pas distinguer "email manquant" de "compte inconnu"
    return { delivered: true };
  }

  let issued = null;

  await writeDb(async (db) => {
    const nowMs = Date.now();
    const user = db.users.find((u) => u.email === email);
    if (!user) return db;

    // Purge des tokens périmés/utilisés + plafond par compte
    const otherResets = (db.password_resets || []).filter((r) => r.userId !== user.uid);
    const userResets = pruneExpired(
      (db.password_resets || []).filter((r) => r.userId === user.uid),
      nowMs,
    );
    const trimmed = userResets
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
      .slice(0, MAX_RESETS_PER_USER - 1);

    const token = generateToken();
    const record = {
      id: 'pwr-' + randomUUID(),
      userId: user.uid,
      token,
      createdAtMs: nowMs,
      expiresAtMs: nowMs + TOKEN_TTL_MS,
      usedAt: null,
    };
    issued = {
      token,
      expiresAt: new Date(record.expiresAtMs).toISOString(),
      email: user.email,
      displayName: user.displayName,
    };
    return { ...db, password_resets: [...otherResets, ...trimmed, record] };
  });

  if (issued) {
    // Trace serveur (à remplacer par un envoi SMTP en prod).
    console.log(
      `[auth] reset password — utilisateur=${issued.email} ` +
        `token=${issued.token} expire=${issued.expiresAt}`,
    );
  }

  const response = { delivered: true };
  if (issued && process.env.NODE_ENV !== 'production') {
    response.devToken = issued.token;
    response.devExpiresAt = issued.expiresAt;
  }
  return response;
}

export async function confirmPasswordReset(token, password) {
  if (typeof token !== 'string' || token.length !== 64) {
    throw makeError('auth/invalid-reset-token', 'Lien de réinitialisation invalide.');
  }
  const safePassword = validatePassword(password);

  await writeDb(async (db) => {
    const nowMs = Date.now();
    const idx = (db.password_resets || []).findIndex(
      (r) => r.token === token && !r.usedAt && r.expiresAtMs > nowMs,
    );
    if (idx === -1) {
      throw makeError(
        'auth/invalid-reset-token',
        'Lien de réinitialisation invalide ou expiré.',
      );
    }
    const reset = db.password_resets[idx];
    const userIdx = db.users.findIndex((u) => u.uid === reset.userId);
    if (userIdx === -1) {
      throw makeError(
        'auth/invalid-reset-token',
        'Lien de réinitialisation invalide ou expiré.',
      );
    }
    const hash = await bcrypt.hash(safePassword, env.bcryptRounds);
    const users = [...db.users];
    users[userIdx] = { ...users[userIdx], password: hash };

    const resets = [...db.password_resets];
    resets[idx] = { ...reset, usedAt: new Date(nowMs).toISOString() };

    return { ...db, users, password_resets: resets };
  });

  return { ok: true };
}

// Petite fonction de maintenance — appelée à l'ouverture des autres flows pour ne pas
// laisser pourrir des tokens dans db.json. Pas exposée publiquement.
export async function purgeExpiredResets() {
  await writeDb(async (db) => {
    const nowMs = Date.now();
    const kept = (db.password_resets || []).filter(
      (r) => !r.usedAt && r.expiresAtMs > nowMs,
    );
    if (kept.length === (db.password_resets || []).length) return db;
    return { ...db, password_resets: kept };
  });
}
