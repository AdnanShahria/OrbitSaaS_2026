// Push notification event handlers for ORBIT SaaS
// This file is imported by the VitePWA-generated service worker

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { title: 'ORBIT SaaS', body: event.data.text() };
    }

    const options = {
        body: data.body || '',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
        },
        actions: data.url ? [{ action: 'open', title: 'Open' }] : [],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'ORBIT SaaS', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing tab if open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open new tab
            return clients.openWindow(urlToOpen);
        })
    );
});
