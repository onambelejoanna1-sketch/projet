import { apiRequest } from './client';

export async function listSensors() {
  const data = await apiRequest('/sensors');
  return data?.sensors || [];
}

export async function getSensor(id) {
  const data = await apiRequest(`/sensors/${encodeURIComponent(id)}`);
  return data?.sensor || null;
}

export async function createSensor(payload) {
  const data = await apiRequest('/sensors', { method: 'POST', body: payload });
  return data?.sensor || null;
}

export async function updateSensor(id, patch) {
  const data = await apiRequest(`/sensors/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: patch,
  });
  return data?.sensor || null;
}

export async function deleteSensor(id) {
  await apiRequest(`/sensors/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return { id };
}

export async function getSensorReadings(id, limit = 24) {
  const data = await apiRequest(
    `/sensors/${encodeURIComponent(id)}/readings?limit=${limit}`,
  );
  return data?.readings || [];
}
