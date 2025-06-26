import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Auto update service worker
      includeAssets: ['favicon.ico', 'CakeCafeLogo.png', 'robots.txt'],
      manifest: {
        name: 'Cake Cafe',
        short_name: 'CakeCafe',
        description: 'A PWA for managing Cake Cafe operations.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#e11d48',
        icons: [
          {
            src: '/CakeCafeLogo.png',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/CakeCafeLogo.png',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'], // Precaches Vite build output
        runtimeCaching: [
          {
            //  Only cache non-streaming Firestore routes
            urlPattern: ({ url }) =>
              url.hostname === 'firestore.googleapis.com' &&
              !url.pathname.includes('/Listen/channel'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400,
              },
            },
          },
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'auth-api-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 3600,
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 2592000,
              },
            },
          },
          {
            urlPattern: /\.(?:mp3)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\/assets\/.*\.(js|css)/, // Vite static assets
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 31536000, // 1 year
              },
            },
          },
          {
            urlPattern: /^\/$/, // App shell root
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 86400,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // Enables PWA in dev
        type: 'module',
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
