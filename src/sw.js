import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()

// O VitePWA vai substituir 'self.__WB_MANIFEST' pela lista de arquivos para cache.
// Não coloque isso dentro de 'if' ou outras estruturas.
precacheAndRoute(self.__WB_MANIFEST)