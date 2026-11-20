self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', e => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch {}
  e.waitUntil(self.registration.showNotification(d.title || 'Flake City', {
    body: d.body || '', icon: '/icon-192.png', data: { link: d.link || '/notifications' },
  }))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const link = e.notification.data?.link || '/'
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if ('focus' in c) { c.navigate(link).catch(() => {}); return c.focus() }
    }
    return self.clients.openWindow(link)
  }))
})