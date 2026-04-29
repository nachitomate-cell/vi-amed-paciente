const CACHE = 'vinamed-paciente-v1';
const ASSETS = ['/','./manifest-paciente.json','./logo_vinamed.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  // No interceptar peticiones de otros dominios (ej: Firebase)
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      
      return fetch(e.request).then(response => {
        // Si la respuesta es una redirección, el navegador bloquea su uso en respondWith
        // si el modo de redirección es 'manual' (común en navegaciones).
        // La solución es crear una nueva respuesta a partir del cuerpo de la original.
        if (response.redirected) {
          return response.blob().then(blob => {
            return new Response(blob, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            });
          });
        }

        // Si la respuesta es válida (200), la devolvemos (podríamos cachear aquí)
        if (response && response.status === 200) {
          return response;
        }
        
        return response;
      }).catch(() => {
        // Fallback solo para navegaciones
        if (e.request.mode === 'navigate') {
          return caches.match('/');
        }
        return null;
      });
    })
  );
});
