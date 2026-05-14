import { env, webPushEnabled } from '../config/env.js';
import {
  attachSseClient,
  listForUser,
  markAllRead,
  markRead,
  unreadCountFor,
} from '../services/notifications.service.js';
import { subscribePush, unsubscribePush } from '../services/push.service.js';

export async function getList(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 30;
    const unreadOnly = req.query.unread === '1' || req.query.unread === 'true';
    const items = await listForUser(req.auth.uid, { limit, unreadOnly });
    const unread = await unreadCountFor(req.auth.uid);
    res.json({ items, unreadCount: unread });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    const unread = await unreadCountFor(req.auth.uid);
    res.json({ unreadCount: unread });
  } catch (err) {
    next(err);
  }
}

export async function postMarkRead(req, res, next) {
  try {
    const updated = await markRead(req.auth.uid, req.params.id);
    const unread = await unreadCountFor(req.auth.uid);
    res.json({ notification: updated, unreadCount: unread });
  } catch (err) {
    next(err);
  }
}

export async function postMarkAllRead(req, res, next) {
  try {
    const result = await markAllRead(req.auth.uid);
    res.json({ ...result, unreadCount: 0 });
  } catch (err) {
    next(err);
  }
}

export function getVapidPublicKey(_req, res) {
  res.json({
    publicKey: webPushEnabled ? env.vapidPublicKey : null,
    enabled: webPushEnabled,
  });
}

export async function postSubscribe(req, res, next) {
  try {
    const result = await subscribePush(req.auth.uid, req.body || {});
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function postUnsubscribe(req, res, next) {
  try {
    const endpoint = req.body?.endpoint;
    const result = await unsubscribePush(req.auth.uid, endpoint);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// SSE — stream temps réel. Auth déjà faite par requireAuthFromQuery.
export function getStream(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Anti-buffering pour proxies type nginx
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const detach = attachSseClient(req.auth.uid, res);

  // Keepalive : un commentaire toutes les 25s pour ne pas que les proxies coupent la conn.
  const keepalive = setInterval(() => {
    try {
      res.write(`: ka ${Date.now()}\n\n`);
    } catch {
      // se résoudra via close
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepalive);
    detach();
  });
}
