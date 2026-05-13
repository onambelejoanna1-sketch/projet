import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { readDb, writeDb } from '../db/jsonStore.js';
import { makeError } from '../utils/errors.js';
import { genUid } from '../utils/ids.js';
import { publicUser } from '../utils/publicUser.js';
import {
  normalizeEmail,
  normalizeRole,
  validateDisplayName,
  validateEmail,
  validatePassword,
} from '../validators/auth.validators.js';

export async function registerUser({ email, password, displayName }) {
  const record = await createUserRecord({ email, password, displayName, role: 'user' });
  const token = signToken(record);
  return { user: publicUser(record), token };
}

export async function createUserByAdmin({ email, password, displayName, role }) {
  const safeRole = normalizeRole(role);
  const record = await createUserRecord({ email, password, displayName, role: safeRole });
  return publicUser(record);
}

async function createUserRecord({ email, password, displayName, role }) {
  const normalizedEmail = validateEmail(email);
  const safePassword = validatePassword(password);
  const safeDisplayName = validateDisplayName(displayName);
  const hash = await bcrypt.hash(safePassword, env.bcryptRounds);
  const next = await writeDb(async (db) => {
    if (db.users.some((u) => u.email === normalizedEmail)) {
      throw makeError('auth/email-already-in-use', 'Cet email est déjà utilisé.');
    }
    const newUser = {
      uid: genUid(),
      email: normalizedEmail,
      password: hash,
      displayName: safeDisplayName,
      role,
      fcmTokens: [],
      notificationPrefs: { enabled: false, zones: [] },
      reportsCount: 0,
      createdAt: new Date().toISOString(),
    };
    return { ...db, users: [...db.users, newUser] };
  });
  return next.users.find((u) => u.email === normalizedEmail);
}

export async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || typeof password !== 'string') {
    throw makeError('auth/wrong-password', 'Email ou mot de passe incorrect.');
  }
  const db = await readDb();
  const found = db.users.find((u) => u.email === normalizedEmail);
  if (!found) {
    throw makeError('auth/wrong-password', 'Email ou mot de passe incorrect.');
  }
  const ok = await bcrypt.compare(password, found.password);
  if (!ok) {
    throw makeError('auth/wrong-password', 'Email ou mot de passe incorrect.');
  }
  const token = signToken(found);
  return { user: publicUser(found), token };
}

export async function meFromUid(uid) {
  const db = await readDb();
  const found = db.users.find((u) => u.uid === uid);
  if (!found) throw makeError('auth/user-not-found', 'Utilisateur introuvable.');
  return publicUser(found);
}

function signToken(user) {
  return jwt.sign(
    { uid: user.uid, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}
