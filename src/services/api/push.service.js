import { apiRequest } from './client';

// ====== Helpers ====================================================================

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function pushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  // On attend que le SW généré par vite-plugin-pwa soit prêt.
  return navigator.serviceWorker.ready;
}

async function getCurrentSubscription() {
  const reg = await getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

// ====== API ========================================================================

export async function getVapidPublicKey() {
  return apiRequest('/notifications/vapid-public-key', { auth: false });
}

async function sendSubscriptionToServer(subscription) {
  const json = subscription.toJSON();
  return apiRequest('/notifications/subscribe', {
    method: 'POST',
    body: {
      endpoint: json.endpoint,
      keys: json.keys,
      userAgent: navigator.userAgent,
    },
  });
}

async function unsubscribeFromServer(endpoint) {
  return apiRequest('/notifications/unsubscribe', {
    method: 'POST',
    body: { endpoint },
  });
}

// ====== Public flows ===============================================================

export async function getPushStatus() {
  if (!isPushSupported()) return { supported: false, permission: 'unsupported', subscribed: false };
  const permission = Notification.permission;
  const sub = permission === 'granted' ? await getCurrentSubscription() : null;
  return {
    supported: true,
    permission,
    subscribed: Boolean(sub),
    endpoint: sub?.endpoint || null,
  };
}

// Active les notifications push pour l'utilisateur courant.
// Étapes : permission → souscription PushManager → envoi au backend.
export async function enablePush() {
  if (!isPushSupported()) {
    throw new Error('Notifications push non supportées par ce navigateur.');
  }
  const reg = await getRegistration();
  if (!reg) {
    throw new Error('Service worker non disponible. Servez l\'app en mode preview (npm run preview:build).');
  }

  // 1) Permission
  if (Notification.permission !== 'granted') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') {
      throw new Error('Permission refusée pour les notifications.');
    }
  }

  // 2) Récupérer la clé VAPID
  const { publicKey, enabled } = await getVapidPublicKey();
  if (!enabled || !publicKey) {
    throw new Error('Notifications push non configurées sur le serveur.');
  }

  // 3) S'abonner via PushManager (idempotent : renvoie la sub existante si déjà active)
  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  // 4) Envoyer au backend
  await sendSubscriptionToServer(subscription);
  return { endpoint: subscription.endpoint };
}

export async function disablePush() {
  const reg = await getRegistration();
  if (!reg) return { ok: true };
  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) return { ok: true };
  const endpoint = subscription.endpoint;
  try {
    await subscription.unsubscribe();
  } catch (err) {
    console.error('[push] unsubscribe local failed', err);
  }
  try {
    await unsubscribeFromServer(endpoint);
  } catch (err) {
    console.error('[push] unsubscribe remote failed', err);
  }
  return { ok: true };
}
