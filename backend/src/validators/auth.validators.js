import { makeError } from '../utils/errors.js';

const EMAIL_RE = /^[^\s@.]+(?:\.[^\s@.]+)*@[^\s@.]+(?:\.[^\s@.]+)*\.[A-Za-z]{2,}$/;

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function validateEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || !EMAIL_RE.test(normalized)) {
    throw makeError('auth/invalid-email', 'Email invalide.');
  }
  return normalized;
}

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw makeError('auth/weak-password', 'Le mot de passe doit contenir au moins 8 caractères.');
  }
  return password;
}

export function validateDisplayName(displayName) {
  const trimmed = String(displayName || '').trim();
  if (trimmed.length < 2 || trimmed.length > 60) {
    throw makeError('auth/invalid-display-name', 'Le nom doit contenir entre 2 et 60 caractères.');
  }
  return trimmed;
}

export function normalizeRole(role) {
  return role === 'admin' ? 'admin' : 'user';
}
