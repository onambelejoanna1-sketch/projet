import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icon.svg', 'icon-maskable.svg'],
      manifest: {
        name: 'Alerte Douala',
        short_name: 'Alerte Douala',
        description:
          "Veille citoyenne des catastrophes naturelles à Douala — signalez, suivez, protégez.",
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FBF8F3',
        theme_color: '#2F5D4A',
        categories: ['utilities', 'news', 'social'],
        icons: [
          {
            src: '/icon.svg',
            sizes: '192x192 512x512 any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon-maskable.svg',
            sizes: '192x192 512x512 any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Signaler une catastrophe',
            short_name: 'Signaler',
            url: '/signaler',
            description: 'Envoyer un nouveau signalement à la communauté.',
          },
          {
            name: 'Voir les alertes',
            short_name: 'Alertes',
            url: '/alertes',
            description: 'Consulter les alertes validées en temps réel.',
          },
          {
            name: 'Carte des risques',
            short_name: 'Carte',
            url: '/carte',
            description: 'Visualiser les zones à risque de Douala.',
          },
        ],
      },
      workbox: {
        // Précache de l'app shell (CSS/JS/HTML générés par le build).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
        // Greffe nos handlers Web Push dans le service worker généré.
        importScripts: ['/sw-push.js'],
        // Stratégies runtime pour les ressources externes et l'API.
        runtimeCaching: [
          {
            // API : network-first avec fallback cache si offline.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 h
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Tuiles OpenStreetMap : cache-first (les tuiles ne changent pas).
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 j
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fonts Google : cache-first.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Navigation fallback : sert index.html en offline pour les routes SPA.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        // Désactivé en dev pour éviter les cache stales pendant l'HMR.
        // Pour tester l'installabilité en local, faire `npm run build && npm run preview`.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
