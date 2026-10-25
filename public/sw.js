const CACHE = "ie-ao-vivo-2"

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/", "/manifest.webmanifest", "/logo-ie.png"])),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) => Promise.all(chaves.filter((chave) => chave !== CACHE).map((chave) => caches.delete(chave)))),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request
  if (pedido.method !== "GET") return
  const url = new URL(pedido.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return
  evento.respondWith(
    fetch(pedido)
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone()
          caches.open(CACHE).then((cache) => cache.put(pedido, copia))
        }
        return resposta
      })
      .catch(() => caches.match(pedido).then((guardado) => guardado || caches.match("/"))),
  )
})
