import { apiRequest } from './client';

function buildQuery(params) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v == null || v === '') continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export async function listDisasters(params = {}) {
  const data = await apiRequest(`/disasters${buildQuery(params)}`);
  return data?.disasters || [];
}

export async function listMyDisasters(uid, limit) {
  if (!uid) return [];
  const data = await apiRequest(
    `/disasters${buildQuery({ reporterId: uid, limit })}`,
  );
  return data?.disasters || [];
}

export async function getDisaster(id) {
  const data = await apiRequest(`/disasters/${encodeURIComponent(id)}`);
  return data?.disaster || null;
}

export async function createDisaster(payload) {
  const data = await apiRequest('/disasters', { method: 'POST', body: payload });
  return data?.disaster || null;
}

export async function validateDisaster(id) {
  const data = await apiRequest(
    `/disasters/${encodeURIComponent(id)}/validate`,
    { method: 'POST' },
  );
  return data?.disaster || null;
}

export async function rejectDisaster(id, reason) {
  const data = await apiRequest(
    `/disasters/${encodeURIComponent(id)}/reject`,
    { method: 'POST', body: { reason } },
  );
  return data?.disaster || null;
}

export async function deleteDisaster(id) {
  await apiRequest(`/disasters/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return { id };
}
