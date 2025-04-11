// frontend/vite.config.js

import { defineConfig, loadEnv } from 'vite'; // Import loadEnv
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Vite Configuration File
 * Defines settings for the development server, build process, and plugins.
 * @see https://vitejs.dev/config/
 */
export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode (development/production)
  // '' allows loading all env vars without prefix filtering initially
  // Loads vars prefixed with VITE_ into process.env via Vite's handling
  const env = loadEnv(mode, process.cwd(), '');

  // --- Prepare configuration values needed at build time ---

  // Get the API base URL string from environment variables. Important for Service Worker.
  // Fallback to an empty string if VITE_API_BASE_URL is not defined during build.
  const backendApiOrigin = env.VITE_API_BASE_URL || '';
  if (mode === 'production' && !backendApiOrigin) {
    console.warn(
      '\n⚠️ WARNING: VITE_API_BASE_URL environment variable is not set for production build.' +
      '\nService worker runtime caching for API calls might not work correctly.\n'
    );
  }

  // Define the matching function for API runtime caching.
  // This function will be stringified and injected into the service worker.
  // It uses the backendApiOrigin variable captured during the build.
  const apiCachePattern = ({ url }) => {
    // Check if backendApiOrigin was defined during build and if the request URL's origin matches it.
    return backendApiOrigin && url.origin === backendApiOrigin;
    // Note: If your API endpoints consistently have a prefix like /api,
    // you might want a more specific match like:
    // return backendApiOrigin && url.href.startsWith(`${backendApiOrigin}/api/`);
  };

  // --- Return the Vite configuration object ---
  return {
    plugins: [
      // React plugin with Fast Refresh
      react(),

      // PWA Plugin Configuration
      VitePWA({
        // Strategy for registering the service worker and handling updates.
        // 'autoUpdate' is recommended for seamless background updates.
        registerType: 'autoUpdate',

        // Files from the 'public' directory to include in the service worker's precache manifest.
        // Ensure these files actually exist in `public/`.
        includeAssets: [
            'favicon.ico',
            'apple-touch-icon.png', // For iOS home screen icons
            'logo.png' // Assuming you have a main logo PNG
            // Add other essential static assets like maskable icons if separate files
        ],

        // Web App Manifest configuration (generates manifest.webmanifest)
        manifest: {
          name: 'Accessible Navigation App',
          short_name: 'AccessibleNav',
          description: 'Navigate public spaces accessibly with wheelchair routes and audio guidance.',
          // Theme colors should match your app's design system
          theme_color: '#4f46e5', // Example: Indigo 600
          background_color: '#ffffff', // White background for splash screen
          display: 'standalone', // Preferred display mode for PWAs
          scope: '/', // Defines the navigation scope
          start_url: '/', // Entry point when launched from home screen
          // Icons for different resolutions and purposes
          icons: [
            {
              src: 'pwa-192x192.png', // Relative to 'public' folder
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png', // Relative to 'public' folder
              sizes: '512x512',
              type: 'image/png',
            },
            {
              // Maskable icon adapts better to different platform icon shapes
              // Often the same as 512x512 if designed appropriately, or a dedicated file.
              src: 'pwa-512x512.png', // Use the 512px icon or specify a maskable version
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable', // Indicate it's suitable for masking
            },
            {
               // Optional: Icon for legacy 'any' purpose if needed
               src: 'pwa-512x512.png',
               sizes: '512x512',
               type: 'image/png',
               purpose: 'any',
             },
          ],
        },

        // Workbox configuration for generating the service worker (sw.js)
        workbox: {
          // Files matching these patterns will be precached. Essential for offline app shell.
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],

          // Remove outdated caches during service worker activation. Recommended.
          cleanupOutdatedCaches: true,

          // Runtime caching rules for dynamic requests (e.g., APIs, fonts)
          runtimeCaching: [
            {
              // Cache Google Fonts Stylesheets (the CSS file)
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst', // Serve from cache first, fetch network if missing
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 }, // Cache for 1 year
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Cache Google Fonts Webfont files (woff2)
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst', // Serve from cache first
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, // Cache for 1 year
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // --- API Call Caching ---
              // Use the pattern defined above which correctly uses the build-time env var
              urlPattern: apiCachePattern,
              // 'NetworkFirst': Try network, fallback to cache. Good for data that might change.
              // 'StaleWhileRevalidate': Serve from cache immediately, update in background. Good for non-critical data.
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-data-cache',
                // How long to keep API responses cached
                expiration: { maxAgeSeconds: 60 * 60 * 24 * 1 }, // Cache for 1 day
                // Cache successful responses (status 0 for opaque cross-origin responses if needed, but usually 200)
                cacheableResponse: { statuses: [0, 200] },
                // Network timeout: If network takes longer than this, fallback to cache (requires NetworkFirst handler)
                networkTimeoutSeconds: 10,
                 // Optional: Add background sync for failed POST/PUT requests later if needed
                 // plugins: [ /* Background Sync Plugin */ ]
              },
            },
            // --- Important Note on Map Tiles ---
            // Do NOT add runtime caching rules for Google Maps map tiles here
            // (e.g., URLs like https://maps.googleapis.com/maps/vt).
            // This often violates Google Maps Platform Terms of Service.
            // Focus on caching your *API data* (routes, points) instead.
          ],

          // Advanced Workbox options (optional)
          // skipWaiting: true, // Force new SW to activate immediately (can cause issues if assets change unexpectedly)
          // clientsClaim: true, // Allow activated SW to control clients immediately
        },
      }),
    ],

    // Build options
    build: {
      // Generate sourcemaps for easier debugging of production code
      // Consider disabling or using 'hidden-source-map' for public production apps
      sourcemap: true,
    },

    // Server options (development)
    server: {
      port: 5173, // Default Vite port
      strictPort: true, // Exit if port is already in use
      open: true, // Automatically open browser on dev server start
      // Optional: Proxy backend requests during development to avoid CORS
      // proxy: {
      //   '/api': {
      //     target: 'http://localhost:5001', // Your local backend URL
      //     changeOrigin: true,
      //     // rewrite: (path) => path.replace(/^\/api/, '') // Optional: if backend doesn't use /api prefix
      //   }
      // }
    },

    // Define base URL if deploying to a subdirectory (not usually needed for Vercel root)
    // base: '/your-subdirectory/',
  }; // End return config object
}); // End defineConfig