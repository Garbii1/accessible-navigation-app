// frontend/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // PWA Caching Strategy Options:
      // - 'autoUpdate': Automatically updates the PWA in the background when new content is available. The user sees the new version on the next visit.
      // - 'prompt': Prompts the user to reload when a new version is available. Requires custom UI handling in your app.
      registerType: 'autoUpdate',

      // Include static assets in the pre-cache list.
      // Make sure these files exist in your `public` directory.
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png'], // Add your main logo/icons here

      // Web App Manifest configuration (manifest.json)
      manifest: {
        name: 'Accessible Navigation App', // Full app name
        short_name: 'AccessibleNav', // Short name for home screens
        description: 'Navigate public spaces accessibly with wheelchair routes and audio guidance.', // App description
        theme_color: '#4f46e5', // Primary theme color (e.g., Indigo-600) - match your design
        background_color: '#ffffff', // Background color for splash screen
        display: 'standalone', // Opens as a standalone app window
        scope: '/', // The navigation scope of the PWA
        start_url: '/', // The initial URL loaded when the PWA starts
        icons: [
          {
            src: 'pwa-192x192.png', // Path relative to the 'public' directory
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png', // Path relative to the 'public' directory
            sizes: '512x512',
            type: 'image/png',
          },
          {
            // Maskable icon adapts better to different platform icon shapes
            src: 'pwa-512x512.png', // Use the same 512 or a dedicated maskable icon file
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable', // Important for adaptive icons
          },
        ],
      },

      // Service worker configuration using Workbox
      workbox: {
        // Pre-cache files matching these patterns during the build process.
        // Includes core assets needed for the app shell to work offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],

        // Runtime caching rules for requests made while the app is running.
        runtimeCaching: [
          {
            // Cache Google Fonts API requests (the CSS file)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst', // Serve from cache first, fallback to network
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10, // Cache up to 10 font requests
                maxAgeSeconds: 60 * 60 * 24 * 365, // Cache for 1 year
              },
              cacheableResponse: { statuses: [0, 200] }, // Cache successful responses
            },
          },
          {
            // Cache Google Fonts static font files (e.g., woff2)
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst', // Serve from cache first
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10, // Cache up to 10 font files
                maxAgeSeconds: 60 * 60 * 24 * 365, // Cache for 1 year
              },
              cacheableResponse: { statuses: [0, 200] }, // Cache successful responses
            },
          },
          {
            // Cache Backend API calls (e.g., route calculations, saved routes)
            // Match requests to your backend API base URL defined in .env
            urlPattern: ({ url }) => url.origin === import.meta.env.VITE_API_BASE_URL,
            handler: 'NetworkFirst', // Try network first, fallback to cache if offline/slow
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 1, // Cache API responses for 1 day
              },
              cacheableResponse: { statuses: [0, 200] }, // Cache successful responses (status 0 for opaque responses if needed)
              networkTimeoutSeconds: 10, // If network takes longer than 10s, use cached version
            },
          },
          // --- IMPORTANT ---
          // Do NOT uncomment or add rules to cache Google Maps tiles here unless you
          // have verified it complies with the latest Google Maps Platform Terms of Service.
          // Standard web caching of tiles is often disallowed. Focus on caching API
          // data (routes, places) instead.
          // { ... map tile rule removed ... }
        ],

        // Optional: Skip waiting and activate the new service worker immediately.
        // Can sometimes cause issues if assets change between page load and SW activation.
        // skipWaiting: true,
        // clientsClaim: true,
      },
    }),
  ],
  // Define base URL if deploying to a subdirectory (usually not needed for Vercel root deployments)
  // base: '/your-subdirectory/',
});