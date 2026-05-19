import { createClient, type Client } from '@libsql/client/web';
import type { Env } from './types';

/**
 * Create a Turso database client from Cloudflare env bindings.
 * Uses the /web import for Workers compatibility (fetch-based, no Node.js APIs).
 */
export function getDb(env: Env): Client {
    return createClient({
        url: env.TURSO_DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN,
    });
}
