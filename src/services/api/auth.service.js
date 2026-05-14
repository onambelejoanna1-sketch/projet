import { apiRequest } from './client';
import { clearToken, getToken, setToken } from './tokenStorage';
import {
  getCurrentUser,
  setCurrentUser,
  setCurrentUserSilent,
  subscribe,
} from './authListeners';

let initialized = false;
let initPromise = null;

function bootstrap() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const token = getToken();
    if (!token) {
      setCurrentUserSilent(null);
      initialized = true;
      return;
    }
    try {
      const data = await apiRequest('/auth/me');
      setCurrentUserSilent(data?.user || null);
    } catch {
      clearToken();
      setCurrentUserSilent(null);
    } finally {
      initialized = true;
    }
  })();
  return initPromise;
}

export async function register({ email, password, displayName, role = 'user' }) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: { email, password, displayName, role },
    auth: false,
  });
  setToken(data.token);
  setCurrentUser(data.user);
  initialized = true;
  return data.user;
}

export async function signIn({ email, password }) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  setToken(data.token);
  setCurrentUser(data.user);
  initialized = true;
  return data.user;
}

export async function requestPasswordReset(email) {
  return apiRequest('/auth/password-reset/request', {
    method: 'POST',
    body: { email },
    auth: false,
  });
}

export async function confirmPasswordReset({ token, password }) {
  return apiRequest('/auth/password-reset/confirm', {
    method: 'POST',
    body: { token, password },
    auth: false,
  });
}

export async function signOut() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // best-effort: serveur indisponible ne doit pas bloquer la déconnexion locale
  }
  clearToken();
  setCurrentUser(null);
  initialized = true;
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  const data = await apiRequest(`/users/${encodeURIComponent(uid)}`);
  return data?.user || null;
}

export function onAuth(callback) {
  const unsubscribe = subscribe(callback);
  if (initialized) {
    queueMicrotask(() => callback(getCurrentUser()));
  } else {
    bootstrap().then(() => {
      queueMicrotask(() => callback(getCurrentUser()));
    });
  }
  return unsubscribe;
}

bootstrap();
