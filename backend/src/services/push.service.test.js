import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// === Mocks ===
let memDb;
const sendNotificationMock = vi.fn();
const setVapidDetailsMock = vi.fn();

vi.mock('../db/jsonStore.js', () => ({
  readDb: async () => structuredClone(memDb),
  writeDb: async (updater) => {
    const next = await updater(structuredClone(memDb));
    memDb = next;
    return memDb;
  },
}));

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: setVapidDetailsMock,
    sendNotification: sendNotificationMock,
  },
}));

// Import APRÈS les mocks.
const {
  listSubscriptionsForUser,
  sendPushToUser,
  subscribePush,
  unsubscribePush,
} = await import('./push.service.js');

const VALID_SUB = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: {
    p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
    auth: 'tBHItJI5svbpez7KI4CCXg',
  },
  userAgent: 'Vitest/1.0',
};

beforeEach(() => {
  memDb = { users: [], push_subscriptions: [] };
  sendNotificationMock.mockReset();
  setVapidDetailsMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('subscribePush', () => {
  test('persiste une subscription valide', async () => {
    const res = await subscribePush('u-1', VALID_SUB);
    expect(res.ok).toBe(true);
    expect(res.id).toMatch(/^push-/);
    expect(memDb.push_subscriptions).toHaveLength(1);
    expect(memDb.push_subscriptions[0]).toMatchObject({
      userId: 'u-1',
      endpoint: VALID_SUB.endpoint,
      userAgent: 'Vitest/1.0',
    });
  });

  test('met à jour la subscription existante si même endpoint', async () => {
    await subscribePush('u-1', VALID_SUB);
    await subscribePush('u-2', VALID_SUB);
    expect(memDb.push_subscriptions).toHaveLength(1);
    expect(memDb.push_subscriptions[0].userId).toBe('u-2');
  });

  test('rejette une subscription sans endpoint https', async () => {
    await expect(
      subscribePush('u-1', { ...VALID_SUB, endpoint: 'http://insecure.example' }),
    ).rejects.toThrow(/Endpoint push invalide/);
  });

  test('rejette une subscription sans keys', async () => {
    await expect(subscribePush('u-1', { endpoint: VALID_SUB.endpoint })).rejects.toThrow(
      /Clés push manquantes/,
    );
  });
});

describe('unsubscribePush', () => {
  test('retire la subscription cible et laisse les autres', async () => {
    await subscribePush('u-1', VALID_SUB);
    await subscribePush('u-2', {
      ...VALID_SUB,
      endpoint: 'https://fcm.googleapis.com/fcm/send/other',
    });
    await unsubscribePush('u-1', VALID_SUB.endpoint);
    expect(memDb.push_subscriptions).toHaveLength(1);
    expect(memDb.push_subscriptions[0].userId).toBe('u-2');
  });

  test('idempotent — pas d\'erreur sur endpoint inconnu', async () => {
    await expect(unsubscribePush('u-1', 'https://nope.example')).resolves.toEqual({
      ok: true,
    });
  });

  test('rejette endpoint vide', async () => {
    await expect(unsubscribePush('u-1', '')).rejects.toThrow(/Endpoint manquant/);
  });
});

describe('listSubscriptionsForUser', () => {
  test('filtre par userId', async () => {
    await subscribePush('u-1', VALID_SUB);
    await subscribePush('u-2', {
      ...VALID_SUB,
      endpoint: 'https://fcm.googleapis.com/fcm/send/x',
    });
    const subs = await listSubscriptionsForUser('u-1');
    expect(subs).toHaveLength(1);
    expect(subs[0].userId).toBe('u-1');
  });
});

describe('sendPushToUser', () => {
  test('renvoie sent=0 si aucune subscription', async () => {
    const result = await sendPushToUser('u-1', {
      id: 'n1',
      title: 't',
      body: 'b',
      type: 'test',
    });
    expect(result).toEqual({ sent: 0, removed: 0 });
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });

  test('envoie un payload aux subscriptions actives', async () => {
    await subscribePush('u-1', VALID_SUB);
    sendNotificationMock.mockResolvedValue({});

    const result = await sendPushToUser('u-1', {
      id: 'notif-1',
      title: 'Hello',
      body: 'World',
      link: '/x',
      type: 'test',
    });
    expect(result.sent).toBe(1);
    expect(result.removed).toBe(0);
    expect(sendNotificationMock).toHaveBeenCalledTimes(1);
    const [target, payloadStr] = sendNotificationMock.mock.calls[0];
    expect(target.endpoint).toBe(VALID_SUB.endpoint);
    const payload = JSON.parse(payloadStr);
    expect(payload).toMatchObject({
      title: 'Hello',
      body: 'World',
      link: '/x',
      type: 'test',
      id: 'notif-1',
    });
  });

  test('supprime les subscriptions retournant 410 (Gone)', async () => {
    await subscribePush('u-1', VALID_SUB);
    const err = new Error('Gone');
    err.statusCode = 410;
    sendNotificationMock.mockRejectedValue(err);

    const result = await sendPushToUser('u-1', { id: 'n', title: 't', body: 'b' });
    expect(result.sent).toBe(0);
    expect(result.removed).toBe(1);
    expect(memDb.push_subscriptions).toHaveLength(0);
  });

  test('conserve les subscriptions sur erreur transitoire (500)', async () => {
    await subscribePush('u-1', VALID_SUB);
    const err = new Error('Server error');
    err.statusCode = 500;
    sendNotificationMock.mockRejectedValue(err);
    // Suppression du log pour ne pas polluer la sortie du test
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await sendPushToUser('u-1', { id: 'n', title: 't', body: 'b' });
    expect(result.sent).toBe(0);
    expect(result.removed).toBe(0);
    expect(memDb.push_subscriptions).toHaveLength(1);
    errSpy.mockRestore();
  });
});
