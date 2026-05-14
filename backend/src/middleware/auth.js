import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { readDb } from '../db/jsonStore.js';
import { makeError } from '../utils/errors.js';
import { publicUser } from '../utils/publicUser.js';

async function authenticateFromToken(token, req) {
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw makeError('auth/invalid-token', 'Session invalide ou expirée.');
  }
  const db = await readDb();
  const found = db.users.find((u) => u.uid === payload.uid);
  if (!found) throw makeError('auth/invalid-token', 'Compte introuvable.');
  req.auth = { uid: found.uid, role: found.role };
  req.user = publicUser(found);
}

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return next(makeError('auth/missing-token', 'Authentification requise.'));
    }
    await authenticateFromToken(match[1], req);
    next();
  } catch (err) {
    next(err);
  }
}

// Variante pour SSE : EventSource ne peut pas envoyer de header Authorization,
// donc on accepte aussi le token via ?token=. Réservé aux endpoints streaming.
export async function requireAuthFromQuery(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const headerMatch = header.match(/^Bearer\s+(.+)$/i);
    const token = headerMatch ? headerMatch[1] : (req.query.token || null);
    if (!token) {
      return next(makeError('auth/missing-token', 'Authentification requise.'));
    }
    await authenticateFromToken(token, req);
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
