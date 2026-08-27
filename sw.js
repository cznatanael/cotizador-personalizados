/* sw.js — Hace que el cotizador abra aunque no haya internet.
 *
 * Estrategia: "primero la red, la copia como respaldo".
 *   - Con internet: siempre gana la version del servidor, asi que nunca
 *     te quedas atorado en una version vieja (el problema clasico de los
 *     service workers mal hechos).
 *   - Sin internet o con senal mala: sirve la ultima copia guardada, que es
 *     justo lo que promete el README ("una vez que carga, sigue funcionando
 *     sin internet"), sobre todo al abrirlo desde el icono del celular.
 *
 * Al cambiar el cotizador, sube VERSION para tirar la cache anterior.
 */
const VERSION = 'v1';
const CACHE = `cotizador-${VERSION}`;

/* El minimo indispensable para que la app arranque sin red. */
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll falla en bloque si un archivo no responde; se guarda uno por uno
      // para que un recurso caido no impida instalar el service worker.
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(nombres => Promise.all(nombres.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;
  // Sin esto intentariamos cachear extensiones del navegador y peticiones ajenas.
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copia = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copia)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit => {
          if (hit) return hit;
          // Una URL nueva estando sin red: igual mostramos la app.
          if (req.mode === 'navigate') {
            return caches.match('./index.html').then(idx => idx || caches.match('./'));
          }
          return Response.error();
        })
      )
  );
});
