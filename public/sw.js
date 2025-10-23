// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: 'notification',
    requireInteraction: false
  };

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.log('Error parsing push data:', e);
  }

  const title = data.title || 'Drogaria Route Flow';
  const body = data.body || options.body;

  event.waitUntil(
    self.registration.showNotification(title, {
      ...options,
      body: body,
      data: data.data || {}
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // If a window is already open, focus it
        for (let client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Cache static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('v1').then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
