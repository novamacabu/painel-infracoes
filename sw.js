/* Painel de Infrações — Nova Macabu · Service Worker
   Estratégia: network-first para arquivos do próprio site (sempre tenta a
   versão mais recente; usa o cache só como reserva offline). Requisições
   externas — como o webhook Make — NUNCA são interceptadas nem cacheadas. */
const CACHE = "painel-infracoes-v1";

self.addEventListener("install", (e) => { self.skipWaiting(); });

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return; // externos passam direto
  e.respondWith((async () => {
    try {
      const resp = await fetch(e.request);
      const c = await caches.open(CACHE);
      c.put(e.request, resp.clone());
      return resp;
    } catch (err) {
      const emCache = await caches.match(e.request);
      if (emCache) return emCache;
      throw err;
    }
  })());
});
