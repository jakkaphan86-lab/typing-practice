/**
 * Offline support helpers for the service worker set up by vite-plugin-pwa
 * (see vite.config.ts for the caching rules).
 */

/**
 * Reload once the waiting service worker has taken control. vite-plugin-pwa
 * only reloads when Workbox flags the change as an update, which it doesn't
 * for a tab that was uncontrolled when it loaded (e.g. the tab that first
 * installed the app and stayed open) — so listen to the browser event directly.
 * Call before asking the waiting worker to activate.
 */
export function reloadWhenNewWorkerTakesOver(): void {
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
}

/** Must match the runtime-cache name for fonts.gstatic.com in vite.config.ts. */
const FONT_CACHE = 'google-fonts-webfonts'
const FONT_STYLESHEETS = 'link[rel="stylesheet"][href^="https://fonts.googleapis.com/"]'
const FONT_URL = /url\((https:\/\/fonts\.gstatic\.com\/[^)\s]+)\)/g

/**
 * On the very first visit the web fonts are downloaded before the service
 * worker controls the page, so its runtime cache never sees them and the app
 * would fall back to system fonts offline. Once the worker is in control,
 * re-request the font stylesheet and files *through* it to fill the caches.
 * A no-op once the font cache is populated.
 */
export async function warmFontCache(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return
  const fontCache = await caches.open(FONT_CACHE)
  if ((await fontCache.keys()).length > 0) return

  await navigator.serviceWorker.ready
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) =>
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }),
    )
  }

  const stylesheets = Array.from(document.querySelectorAll<HTMLLinkElement>(FONT_STYLESHEETS), (l) => l.href)
  for (const href of stylesheets) {
    const css = await (await fetch(href)).text()
    const fontUrls = Array.from(css.matchAll(FONT_URL), (m) => m[1]).filter((u): u is string => !!u)
    await Promise.allSettled(fontUrls.map((url) => fetch(url, { mode: 'cors' })))
  }
}
