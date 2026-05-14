import { apiRequest } from './client';
import { getToken } from './tokenStorage';

export async function listNotifications({ limit, unreadOnly } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (unreadOnly) params.set('unread', '1');
  const qs = params.toString();
  return apiRequest(`/notifications${qs ? `?${qs}` : ''}`);
}

export async function getUnreadCount() {
  return apiRequest('/notifications/unread-count');
}

export async function markNotificationRead(id) {
  return apiRequest(`/notifications/${encodeURIComponent(id)}/read`, {
    method: 'POST',
  });
}

export async function markAllNotificationsRead() {
  return apiRequest('/notifications/read-all', { method: 'POST' });
}

// SSE — EventSource ne peut pas envoyer Authorization, on passe le token en query.
// Renvoie un objet { close() } pour se désabonner.
export function subscribeNotifications({ onNotification, onError, onOpen } = {}) {
  const token = getToken();
  if (!token || typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return { close: () => {} };
  }
  const url = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
  const source = new EventSource(url);

  source.addEventListener('open', () => {
    onOpen?.();
  });

  source.addEventListener('notification', (event) => {
    try {
      const data = JSON.parse(event.data);
      onNotification?.(data);
    } catch (err) {
      console.error('[notifications/sse] parse error', err);
    }
  });

  source.addEventListener('error', (event) => {
    // EventSource gère la reconnexion auto, on logue juste.
    onError?.(event);
  });

  return {
    close() {
      source.close();
    },
  };
}
