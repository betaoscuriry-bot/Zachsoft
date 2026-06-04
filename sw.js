// Clóset Soft Boy - PWA Service Worker for Background Processing and Sync
const CACHE_NAME = 'softboy-closet-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Implement Background Sync API
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ai-chat' || event.tag.startsWith('ai-sync-')) {
    event.waitUntil(processBackgroundAIRequests());
  }
});

// Implement Periodic Sync for morning outfit digests
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'morning-outfit-digest') {
    event.waitUntil(triggerMorningDigest());
  }
});

// Capture push notification actions or client messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'BG_PROCESS_AI') {
    const payload = event.data.payload;
    // Process server chat in the background and notify once ready
    event.waitUntil(
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error('Network response bad');
        return res.json();
      })
      .then(data => {
        const replyText = data.reply || data.response || 'Tu outfit ya está listo para hoy. 🧸';
        
        // Save background response to local DB / notify clients
        return self.registration.showNotification('🧸 Clóset Soft Boy', {
          body: replyText.substring(0, 120) + (replyText.length > 120 ? '...' : ''),
          icon: '/assets/bear-logo.png',
          badge: '/assets/bear-logo.png',
          vibrate: [100, 50, 100],
          data: {
            reply: replyText,
            processedAt: Date.now()
          }
        });
      })
      .catch(err => {
        console.error('Background AI Failed:', err);
      })
    );
  }
});

// Process cached sync queue or run default trigger helper
async function processBackgroundAIRequests() {
  console.log('[SW] Processing background AI queue...');
}

async function triggerMorningDigest() {
  // Trigger cozy morning Soft Boy outfit recommendation
  const greetings = [
    '☕¡Buenos días, lindicto! El clima está fresco hoy.',
    '🧣 ¡Hola! Aiko preparó tu outfit Soft Boy perfecto para hoy.',
    '☁️ El cielo se ve nublado. Te recomiendo revisar tus abrigos.'
  ];
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  await self.registration.showNotification('🧸 Tu Inspiración de la Mañana', {
    body: randomGreeting,
    vibrate: [80, 40, 80]
  });
}

// Notification clicking handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
