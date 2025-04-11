// frontend/vite.config.js
import { defineConfig, loadEnv } from 'vite'; // Import loadEnv
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => { // Use function export to access mode
  // Load env variables based on the current mode (development/production)
  // The third argument '' loads all env vars without prefix filtering initially
  // The fourth argument loads env vars specifically prefixed with VITE_
  const env = loadEnv(mode, process.cwd(), '');

  // Construct the API base URL string based on loaded env
  // Important: Handle potential missing env var during build
  const apiBaseUrlString = env.VITE_API_BASE_URL || ''; // Fallback to empty string if undefined

  // Define the URL pattern for API caching using the string value
  const apiCachePattern = ({ url }) => {
     // Ensure apiBaseUrlString is not empty before comparing
     return apiBaseUrlString && url.origin === apiBaseUrlString;
     // If your API routes include /api, match against that full origin+path prefix
     // return apiBaseUrlString && url.href.startsWith(`${apiBaseUrlString}/api`);
  };


  return { // Return the config object
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png'],
        manifest: { /* ... manifest object ... */ },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
          runtimeCaching: [
            { /* ... google fonts rules ... */ },
            { /* ... google fonts rules ... */ },
            {
              // --- UPDATED API Caching Rule ---
              // Use the function defined above which uses the build-time string
              urlPattern: apiCachePattern,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { maxAgeSeconds: 60 * 60 * 24 * 1 },
                cacheableResponse: { statuses: [0, 200] },
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
      }),
    ],
  }; // End return config object
});