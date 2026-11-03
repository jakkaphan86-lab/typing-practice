import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const YEAR_IN_SECONDS = 60 * 60 * 24 * 365

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // A new version waits until the user accepts it (see <ReloadPrompt />),
      // so an update never reloads the page mid-session.
      registerType: 'prompt',
      manifest: {
        name: 'Typing Practice',
        short_name: 'Typing',
        lang: 'th',
        description: 'Distraction-free typing practice for Thai and English.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Precache the whole app shell: every JS chunk (incl. the lazy chart), CSS and HTML.
        // The manifest and its icons are added automatically by the plugin.
        globPatterns: ['**/*.{js,css,html}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // Take control of the page on first install, so the font warm-up
        // (src/lib/pwa.ts) is routed through the caches below.
        clientsClaim: true,
        runtimeCaching: [
          {
            // Google Fonts stylesheet: serve from cache, refresh in the background.
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // Font files are immutable (versioned URLs): cache-first for a year.
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 60, maxAgeSeconds: YEAR_IN_SECONDS },
            },
          },
        ],
      },
    }),
  ],
})
