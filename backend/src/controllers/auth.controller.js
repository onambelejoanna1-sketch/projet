import { loginUser, meFromUid, registerUser } from '../services/auth.service.js';
import {
  confirmPasswordReset,
  requestPasswordReset,
} from '../services/passwordResets.service.js';

export async function register(req, res, next) {
  try {
    const { email, password, displayName } = req.body || {};
    const { user, token } = await registerUser({ email, password, displayName });
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const { user, token } = await loginUser({ email, password });
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await meFromUid(req.auth.uid);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req, res) {
  res.status(204).end();
}

export async function postPasswordResetRequest(req, res, next) {
  try {
    const { email } = req.body || {};
    const result = await requestPasswordReset(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function postPasswordResetConfirm(req, res, next) {
  try {
    const { token, password } = req.body || {};
    const result = await confirmPasswordReset(token, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
