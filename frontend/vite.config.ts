import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// @prerenderer/* packages require puppeteer which is heavy and only needed
// for production builds.  We load them lazily below so `vite dev` never
// tries to resolve the missing puppeteer dependency.

// Helper: returns the prerender plugin only for production builds
async function getPrerenderPlugin() {
  try {
    // Check if puppeteer is importable since it's a peer dependency required by the renderer
    // @ts-expect-error: puppeteer is an optional peer dependency
    await import("puppeteer");
    const { default: prerender } = await import("@prerenderer/rollup-plugin");
    const { default: PuppeteerRenderer } = await import("@prerenderer/renderer-puppeteer");

    return prerender({
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
    });
  } catch (err) {
    console.warn("[Prerender] Skipping prerendering: puppeteer or @prerenderer dependencies are not installed.");
    return null;
  }
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  // Only load the prerender plugin in production and when not running in CI/Cloudflare Pages
  const isCI = process.env.CI === "true" || !!process.env.CF_PAGES;
  const prerenderPlugin = (mode === "production" && !isCI) ? await getPrerenderPlugin() : null;

  return {
    base: '/',
    envDir: '../',
    assetsInclude: ['**/*.lottie'],
    server: {
      host: "::",
      port: 6970,
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
      prerenderPlugin,
    ].filter(Boolean),
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) {
                return 'vendor';
              }
              if (id.includes('framer-motion')) {
                return 'framer-motion';
              }
              if (
                id.includes('@radix-ui/') ||
                id.includes('lucide-react/') ||
                id.includes('clsx/') ||
                id.includes('tailwind-merge/')
              ) {
                return 'ui';
              }
              if (id.includes('three/') || id.includes('@react-three/')) {
                return 'three';
              }
              if (id.includes('recharts/')) {
                return 'charts';
              }
              if (id.includes('@lottiefiles/') || id.includes('lottie-react/')) {
                return 'lottie';
              }
            }
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
  };
});
