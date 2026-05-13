import { apiRequest } from './client';

export async function getUser(uid) {
  if (!uid) return null;
  const data = await apiRequest(`/users/${encodeURIComponent(uid)}`);
  return data?.user || null;
}

export async function listUsers() {
  const data = await apiRequest('/users');
  return data?.users || [];
}

export async function createUserByAdmin({ email, password, displayName, role }) {
  const data = await apiRequest('/users', {
    method: 'POST',
    body: { email, password, displayName, role },
  });
  return data?.user || null;
}

export async function deleteUser(uid) {
  if (!uid) throw new Error('uid requis');
  await apiRequest(`/users/${encodeURIComponent(uid)}`, { method: 'DELETE' });
  return { uid };
}

export async function addFcmToken(uid, token) {
  const data = await apiRequest(`/users/${encodeURIComponent(uid)}/fcm-tokens`, {
    method: 'POST',
    body: { token },
  });
  return data?.user || null;
}

export async function removeFcmToken(uid, token) {
  const data = await apiRequest(`/users/${encodeURIComponent(uid)}/fcm-tokens`, {
    method: 'DELETE',
    body: { token },
  });
  return data?.user || null;
}

export async function updateNotificationZones(uid, zones) {
  const data = await apiRequest(`/users/${encodeURIComponent(uid)}/notifications`, {
    method: 'PATCH',
    body: { zones },
  });
  return data?.user || null;
}

export async function updateNotificationPrefs(uid, prefs) {
  const data = await apiRequest(`/users/${encodeURIComponent(uid)}/notifications`, {
    method: 'PATCH',
    body: prefs || {},
  });
  return data?.user || null;
}

export async function updateUserProfile(uid, patch) {
  if (!uid) throw new Error('uid requis');
  const data = await apiRequest(`/users/${encodeURIComponent(uid)}`, {
    method: 'PATCH',
    body: patch || {},
  });
  return data?.user || null;
}
