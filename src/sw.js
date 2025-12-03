import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()

if (self.__WB_MANIFEST) {
  precacheAndRoute(self.__WB_MANIFEST)
}