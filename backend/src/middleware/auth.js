import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { readDb } from '../db/jsonStore.js';
import { makeError } from '../utils/errors.js';
import { publicUser } from '../utils/publicUser.js';

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return next(makeError('auth/missing-token', 'Authentification requise.'));
    }
    const token = match[1];
    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      return next(makeError('auth/invalid-token', 'Session invalide ou expirée.'));
    }
    const db = await readDb();
    const found = db.users.find((u) => u.uid === payload.uid);
    if (!found) {
      return next(makeError('auth/invalid-token', 'Compte introuvable.'));
    }
    req.auth = { uid: found.uid, role: found.role };
    req.user = publicUser(found);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req, _res, next) {
  if (!req.auth) return next(makeError('auth/missing-token', 'Authentification requise.'));
  if (req.auth.role !== 'admin') {
    return next(makeError('auth/forbidden', 'Accès réservé aux administrateurs.'));
  }
  next();
}

export function requireSelfOrAdmin(paramName = 'uid') {
  return function (req, _res, next) {
    if (!req.auth) return next(makeError('auth/missing-token', 'Authentification requise.'));
    if (req.auth.role === 'admin') return next();
    if (req.params[paramName] === req.auth.uid) return next();
    return next(makeError('auth/forbidden', 'Vous ne pouvez modifier que votre propre compte.'));
  };
}
