/* Alerte Douala — handlers Web Push
 *
 * Importé dans le service worker généré par vite-plugin-pwa via l'option
 * workbox.importScripts (voir vite.config.js).
 *
 * Le SW principal s'occupe du précache + cache runtime ; ce fichier ajoute :
 *   - 'push'              → affichage de la notification OS-level
 *   - 'notificationclick' → focus de l'onglet existant ou ouverture sur le lien
 */

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Alerte Douala', body: event.data.text() };
  }
  const title = payload.title || 'Alerte Douala';
  const body = payload.body || '';
  const link = payload.link || '/';
  const tag = payload.id || `alerte-douala-${Date.now()}`;
  const options = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag,
    data: { link, type: payload.type || null, id: payload.id || null },
    // Coalescing : si une notif avec le même tag arrive, elle remplace l'ancienne
    // au lieu d'empiler. Mais on garde 'renotify' à true pour resignaler l'user.
    renotify: true,
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification?.data?.link || '/';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      // Focus un onglet déjà ouvert sur l'app et navigue vers la cible.
      for (const client of allClients) {
        if ('focus' in client) {
          try {
            if (client.url && new URL(client.url).origin === self.location.origin) {
              await client.focus();
              if ('navigate' in client) {
                client.navigate(target);
              }
              return;
            }
          } catch {
            // ignore — on retombe sur l'ouverture d'un nouvel onglet
          }
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(target);
      }
    })(),
  );
});
