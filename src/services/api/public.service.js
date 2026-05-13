import { apiRequest } from './client';

export async function getPublicFeed(limit = 6) {
  const data = await apiRequest(`/public/feed?limit=${limit}`, { auth: false });
  return data?.feed || [];
}

export async function getPublicTicker(limit = 6) {
  const data = await apiRequest(`/public/ticker?limit=${limit}`, { auth: false });
  return data?.ticker || [];
}

export async function getPublicStats() {
  const data = await apiRequest('/public/stats', { auth: false });
  return data?.stats || null;
}

export async function listPublicSensors() {
  const data = await apiRequest('/public/sensors', { auth: false });
  return data?.sensors || [];
}
