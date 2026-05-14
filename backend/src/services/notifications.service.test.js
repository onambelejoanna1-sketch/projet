import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// In-memory store partagé entre readDb / writeDb pendant chaque test.
let memDb;

vi.mock('../db/jsonStore.js', () => ({
  readDb: async () => structuredClone(memDb),
  writeDb: async (updater) => {
    const next = await updater(structuredClone(memDb));
    memDb = next;
    return memDb;
  },
}));

// Service importé APRÈS le mock pour qu'il pointe sur notre store mémoire.
const {
  listForUser,
  markAllRead,
  markRead,
  notifyAdmins,
  notifyEveryone,
  notifyUser,
  unreadCountFor,
} = await import('./notifications.service.js');

beforeEach(() => {
  memDb = {
    users: [
      { uid: 'u-1', email: 'a@test.com', role: 'user', displayName: 'Alice' },
      { uid: 'u-2', email: 'b@test.com', role: 'user', displayName: 'Bob' },
      { uid: 'a-1', email: 'admin@test.com', role: 'admin', displayName: 'Admin' },
    ],
    notifications: [],
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('notifyUser', () => {
  test('crée une notification pour un seul user', async () => {
    const notif = await notifyUser({
      userId: 'u-1',
      type: 'disaster.validated',
      title: 'Validé',
      body: 'OK',
    });
    expect(notif).toMatchObject({
      userId: 'u-1',
      type: 'disaster.validated',
      title: 'Validé',
      body: 'OK',
      readAt: null,
    });
    expect(notif.id).toMatch(/^notif-/);
    expect(memDb.notifications).toHaveLength(1);
  });

  test('renvoie null si userId vide', async () => {
    const result = await notifyUser({ userId: '', title: 't', body: 'b' });
    expect(result).toBeNull();
    expect(memDb.notifications).toHaveLength(0);
  });

  test('tronque les titres et bodies trop longs', async () => {
    const notif = await notifyUser({
      userId: 'u-1',
      type: 'test',
      title: 'a'.repeat(200),
      body: 'b'.repeat(500),
    });
    expect(notif.title.length).toBe(120);
    expect(notif.body.length).toBe(400);
  });
});

describe('notifyAdmins', () => {
  test('envoie uniquement aux users role=admin', async () => {
    const created = await notifyAdmins({
      type: 'sensor.critical',
      title: 'Alerte',
      body: 'Critical',
    });
    expect(created).toHaveLength(1);
    expect(created[0].userId).toBe('a-1');
  });
});

describe('notifyEveryone', () => {
  test('envoie à tous les users (users + admins)', async () => {
    const created = await notifyEveryone({
      type: 'sensor.critical',
      title: 'Alerte',
      body: 'b',
    });
    const recipients = created.map((n) => n.userId).sort();
    expect(recipients).toEqual(['a-1', 'u-1', 'u-2']);
  });

  test('ne crée pas de doublon si même user listé deux fois', async () => {
    memDb.users.push({ uid: 'u-1', email: 'dup', role: 'user' }); // doublon volontaire
    const created = await notifyEveryone({ type: 't', title: 't', body: 'b' });
    const recipients = created.map((n) => n.userId);
    const unique = [...new Set(recipients)];
    expect(recipients).toHaveLength(unique.length);
  });
});

describe('listForUser', () => {
  test('renvoie seulement les notifs de cet user, plus récentes en premier', async () => {
    await notifyUser({ userId: 'u-1', type: 't', title: 'old', body: 'b' });
    await new Promise((r) => setTimeout(r, 5));
    await notifyUser({ userId: 'u-1', type: 't', title: 'mid', body: 'b' });
    await new Promise((r) => setTimeout(r, 5));
    await notifyUser({ userId: 'u-1', type: 't', title: 'new', body: 'b' });
    await notifyUser({ userId: 'u-2', type: 't', title: 'other', body: 'b' });

    const list = await listForUser('u-1');
    expect(list).toHaveLength(3);
    expect(list[0].title).toBe('new');
    expect(list[2].title).toBe('old');
  });

  test('filtre unreadOnly', async () => {
    const a = await notifyUser({ userId: 'u-1', type: 't', title: 'a', body: 'b' });
    await notifyUser({ userId: 'u-1', type: 't', title: 'b', body: 'b' });
    await markRead('u-1', a.id);

    const onlyUnread = await listForUser('u-1', { unreadOnly: true });
    expect(onlyUnread).toHaveLength(1);
    expect(onlyUnread[0].title).toBe('b');
  });

  test('respecte le plafond limit', async () => {
    for (let i = 0; i < 5; i += 1) {
      await notifyUser({ userId: 'u-1', type: 't', title: `n${i}`, body: 'b' });
    }
    const list = await listForUser('u-1', { limit: 2 });
    expect(list).toHaveLength(2);
  });
});

describe('unreadCountFor', () => {
  test('compte uniquement les non-lues de l\'user', async () => {
    await notifyUser({ userId: 'u-1', type: 't', title: 'a', body: 'b' });
    await notifyUser({ userId: 'u-1', type: 't', title: 'b', body: 'b' });
    await notifyUser({ userId: 'u-2', type: 't', title: 'c', body: 'b' });
    expect(await unreadCountFor('u-1')).toBe(2);
    expect(await unreadCountFor('u-2')).toBe(1);
  });
});

describe('markRead', () => {
  test('marque une notif comme lue + idempotent', async () => {
    const n = await notifyUser({ userId: 'u-1', type: 't', title: 't', body: 'b' });
    const first = await markRead('u-1', n.id);
    expect(first.readAt).toBeTruthy();
    const second = await markRead('u-1', n.id);
    expect(second.readAt).toBe(first.readAt);
  });

  test('refuse de marquer la notif d\'un autre user', async () => {
    const n = await notifyUser({ userId: 'u-1', type: 't', title: 't', body: 'b' });
    await expect(markRead('u-2', n.id)).rejects.toThrow(/introuvable/);
  });

  test('refuse un id inexistant', async () => {
    await expect(markRead('u-1', 'notif-fake')).rejects.toThrow(/introuvable/);
  });
});

describe('markAllRead', () => {
  test('marque tout comme lu pour l\'user et renvoie le compte', async () => {
    await notifyUser({ userId: 'u-1', type: 't', title: 'a', body: 'b' });
    await notifyUser({ userId: 'u-1', type: 't', title: 'b', body: 'b' });
    await notifyUser({ userId: 'u-2', type: 't', title: 'c', body: 'b' });
    const res = await markAllRead('u-1');
    expect(res.count).toBe(2);
    expect(await unreadCountFor('u-1')).toBe(0);
    // l'autre user reste intact
    expect(await unreadCountFor('u-2')).toBe(1);
  });
});
