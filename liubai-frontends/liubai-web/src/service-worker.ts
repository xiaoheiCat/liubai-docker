import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

console.log("[my service worker] Hello, service worker!")

self.addEventListener('message', (event) => {
  const eData = event.data
  if (!eData) return
  if (eData.type === 'SKIP_WAITING') {
    console.log("[my service worker] skip waiting")
    self.skipWaiting()
  }
})

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST)

// clean old assets after the new service-worker is activated
// in this function, it will invoke self.addEventListener("activate") and then
// use its callback to clean old assets
cleanupOutdatedCaches()

self.addEventListener("install", (evt) => {
  console.log("[my service worker] install......")
  console.log(evt)
})

self.addEventListener("activate", (evt) => {
  console.log("[my service worker] activate......")
  console.log(evt)
})

// to allow work offline
let allowlist: undefined | RegExp[]
if (import.meta.env.DEV) {
  allowlist = [/^\/$/]
}
const boundToIndex = createHandlerBoundToURL('index.html')
const navigationIndex = new NavigationRoute(boundToIndex, {
  allowlist,
  denylist: [
    /^\/lib\//,
  ]
})
registerRoute(navigationIndex)


// to handle web push
self.addEventListener('push', (event) => {
  if (!event.data) return

  let title = '留白 Liubai'
  let options: NotificationOptions = {
    icon: '/logos/logo_192x192_v2.png'
  }

  try {
    const payload = event.data.json()
    // 8030 is the custom web_push code defined in the backend
    if (payload.web_push === 8030 && payload.notification) {
      title = payload.notification.title || title
      options = {
        ...options,
        body: payload.notification.body,
        tag: payload.notification.tag,
        data: {
          navigate: payload.notification.navigate,
        },
      };
      if (payload.notification.timestamp) {
        (options as any).timestamp = payload.notification.timestamp;
      }
    } else {
      options.body = event.data.text()
    }
  } catch (e) {
    options.body = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// to handle web push click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const navigateUrl = event.notification.data?.navigate
  if (!navigateUrl) return

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if (client.url === navigateUrl && 'focus' in client) {
          return client.focus()
        }
      }
      // If not open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(navigateUrl)
      }
    })
  )
})
