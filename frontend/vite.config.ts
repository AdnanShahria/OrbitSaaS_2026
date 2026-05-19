import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import prerender from "@prerenderer/rollup-plugin";
import PuppeteerRenderer from "@prerenderer/renderer-puppeteer";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  assetsInclude: ['**/*.lottie'],
  server: {
    host: "::",
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://orbitsaas.cloud', // Proxy to prod to bypass CORS when sharing on local network
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.png', 'robots.txt'],
      manifest: {
        name: 'ORBIT SaaS – Best Website Development Company | Custom Web Solutions',
        short_name: 'ORBIT SaaS',
        description: 'Top website development company offering custom web solutions, web app development, eCommerce platforms, SaaS products & enterprise software. Build your website today.',
        lang: 'en',
        theme_color: '#6C5CE7',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB (accommodates high-res 5.14 MB OrbitLogo)
        importScripts: ['/sw-push.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-image-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
    mode === "production" && prerender({
      routes: [
        '/',
        '/services',
        '/process',
        '/techstack',
        '/why-us',
        '/projects',
        '/reviews',
        '/leadership',
        '/contact'
      ],
      renderer: new PuppeteerRenderer({
        renderAfterDocumentEvent: 'custom-render-trigger',
        // Optional: wait for a specific time just to be safe if event fails
        renderAfterTime: 5000, 
        timeout: 60000, // Important for Lottie/3D loading
        maxConcurrentRoutes: 4, 
      }),
      postProcess(renderedRoute) {
        // Strip out any scripts that aren't needed for SEO to keep payload light
        // The object is mutated in place, return void
      }
    }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          'framer-motion': ['framer-motion'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'lucide-react', 'clsx', 'tailwind-merge'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          charts: ['recharts'],
          lottie: ['@lottiefiles/dotlottie-react', 'lottie-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
