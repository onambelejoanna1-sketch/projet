import { apiRequest } from './client';

export async function getAdminStats() {
  const data = await apiRequest('/admin/stats');
  return data?.stats || null;
}

export async function listActivity(limit = 20) {
  const data = await apiRequest(`/admin/activity?limit=${limit}`);
  return data?.activity || [];
}

export async function listTopZones(days = 30, limit = 5) {
  const data = await apiRequest(`/admin/top-zones?days=${days}&limit=${limit}`);
  return data?.zones || [];
}

export async function getAlertsBuckets() {
  const data = await apiRequest('/admin/alerts/buckets');
  return (
    data?.buckets || {
      pending: [],
      validated: [],
      rejected: [],
      sensorsLive: [],
      all: [],
    }
  );
}
