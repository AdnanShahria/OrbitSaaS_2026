/**
 * Environment bindings for Cloudflare Pages Functions.
 * These are configured in the Cloudflare Dashboard or wrangler.toml.
 */
export interface Env {
  // Database
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;

  // Auth
  JWT_SECRET: string;
  PAYLOAD_SECRET?: string;
  ADMIN_ACCESS_CODE: string;
  ADMIN_PASSWORD: string;
  ADMIN_EMAIL?: string;

  // AI
  GROQ_API_KEY: string;

  // Image upload
  VITE_IMGBB_API_KEY: string;

  // Email (SendPulse)
  SENDPULSE_API_USER_ID: string;
  SENDPULSE_API_SECRET: string;

  // Cloudflare Cache Purge
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ZONE_ID: string;

  // Cloudflare Pages static assets binding
  ASSETS: Fetcher;

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_EMAIL: string;
}
