import { randomUUID } from 'node:crypto';
import webpush from 'web-push';
import { env, webPushEnabled } from '../config/env.js';
import { readDb, writeDb } from '../db/jsonStore.js';
import { makeError } from '../utils/errors.js';

if (webPushEnabled) {
  webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
} else {
  console.warn(
    '[push] VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY manquantes — Web Push désactivé.',
  );
}

// ====== Validation =================================================================

function validateSubscription(input) {
  if (!input || typeof input !== 'object') {
    throw makeError('push/invalid-subscription', 'Subscription invalide.');
  }
  const endpoint = String(input.endpoint || '').trim();
  if (!endpoint.startsWith('https://')) {
    throw makeError('push/invalid-subscription', 'Endpoint push invalide.');
  }
  const keys = input.keys || {};
  if (typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') {
    throw makeError('push/invalid-subscription', 'Clés push manquantes.');
  }
  const userAgent = String(input.userAgent || '').slice(0, 200) || null;
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth }, userAgent };
}

// ====== Subscribe / Unsubscribe ====================================================

export async function subscribePush(userId, input) {
  if (!webPushEnabled) {
    throw makeError('push/disabled', 'Notifications push non configurées sur le serveur.');
  }
  const safe = validateSubscription(input);
  const nowIso = new Date().toISOString();
  let stored;
  await writeDb(async (db) => {
    const list = db.push_subscriptions || [];
    const existingIdx = list.findIndex((s) => s.endpoint === safe.endpoint);
    if (existingIdx !== -1) {
      // Re-attribue la subscription à cet user (cas où l'appareil change de compte)
      const next = [...list];
      stored = {
        ...list[existingIdx],
        userId,
        keys: safe.keys,
        userAgent: safe.userAgent ?? list[existingIdx].userAgent,
        updatedAt: nowIso,
      };
      next[existingIdx] = stored;
      return { ...db, push_subscriptions: next };
    }
    stored = {
      id: 'push-' + randomUUID(),
      userId,
      endpoint: safe.endpoint,
      keys: safe.keys,
      userAgent: safe.userAgent,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    return { ...db, push_subscriptions: [stored, ...list] };
  });
  return { ok: true, id: stored.id };
}

export async function unsubscribePush(userId, endpoint) {
  if (typeof endpoint !== 'string' || !endpoint) {
    throw makeError('push/invalid-subscription', 'Endpoint manquant.');
  }
  await writeDb(async (db) => {
    const list = db.push_subscriptions || [];
    const next = list.filter((s) => !(s.userId === userId && s.endpoint === endpoint));
    return { ...db, push_subscriptions: next };
  });
  return { ok: true };
}

export async function listSubscriptionsForUser(userId) {
  const db = await readDb();
  return (db.push_subscriptions || []).filter((s) => s.userId === userId);
}

async function removeDeadSubscriptions(endpoints) {
  if (!endpoints.length) return;
  await writeDb(async (db) => {
    const list = db.push_subscriptions || [];
    const set = new Set(endpoints);
    return { ...db, push_subscriptions: list.filter((s) => !set.has(s.endpoint)) };
  });
}

// ====== Dispatch ===================================================================

// Envoie un push à toutes les subscriptions d'un utilisateur.
// Les subscriptions périmées (404/410) sont supprimées automatiquement.
export async function sendPushToUser(userId, notification) {
  if (!webPushEnabled) return { sent: 0, removed: 0 };
  const subs = await listSubscriptionsForUser(userId);
  if (subs.length === 0) return { sent: 0, removed: 0 };

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    link: notification.link || '/',
    type: notification.type,
    id: notification.id,
  });

  const dead = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload,
          { TTL: 60 * 60 * 24 }, // garde le message 24 h dans le service push
        );
        sent += 1;
      } catch (err) {
        // 404 Not Found et 410 Gone : la subscription est morte chez le push provider
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          dead.push(sub.endpoint);
        } else {
          console.error('[push] échec envoi :', err?.statusCode, err?.body || err?.message);
        }
      }
    }),
  );

  if (dead.length) {
    await removeDeadSubscriptions(dead);
  }
  return { sent, removed: dead.length };
}
