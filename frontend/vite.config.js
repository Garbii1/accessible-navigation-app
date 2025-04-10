import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically update the PWA when new content is available
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'], // Add your static assets here
      manifest: {
        name: 'Accessible Navigation App',
        short_name: 'AccessibleNav',
        description: 'Navigate public spaces accessibly.',
        theme_color: '#ffffff', // Choose your theme color
        background_color: '#ffffff', // Choose your background color
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png', // Create these icon files
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png', // Create these icon files
            sizes: '512x512',
            type: 'image/png',
          },
           {
            src: 'pwa-512x512.png', // Maskable icon
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
      },
      // Service worker configuration (Workbox)
      workbox: {
         globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'], // Files to cache
         runtimeCaching: [
            {
              // Cache Google Fonts
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 year
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 year
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
               // Cache API calls (Network first, fallback to cache)
               // Adjust the urlPattern to match your backend API URL
               urlPattern: ({ url }) => url.origin === import.meta.env.VITE_API_BASE_URL,
               handler: 'NetworkFirst',
               options: {
                 cacheName: 'api-cache',
                 expiration: { maxAgeSeconds: 60 * 60 * 24 }, // 1 day
                 cacheableResponse: { statuses: [0, 200] },
                 networkTimeoutSeconds: 10 // Fallback to cache if network takes too long
               }
            },
            {
                // Cache Map Tiles (Example - Be CAREFUL with Google Maps ToS)
                // This is a basic example, Google Maps tile caching is complex and might violate ToS.
                // Consider caching *route data* instead of tiles for offline.
                // urlPattern: /^https:\/\/maps\.googleapis\.com\/maps\/vt\?pb=/,
                // handler: 'CacheFirst',
                // options: {
                //   cacheName: 'map-tile-cache',
                //   expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 1 week
                //   cacheableResponse: { statuses: [0, 200] }
                // }
            }
         ]
      }
    })
  ],
})