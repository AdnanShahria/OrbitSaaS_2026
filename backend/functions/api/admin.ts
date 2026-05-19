import { getDb } from '../_lib/db';
import { getCorsHeaders, handleOptions, jsonResponse } from '../_lib/cors';
import { isAuthorized } from '../_lib/auth';
import type { Env } from '../_lib/types';

// ─── Helper: Image URL extraction ───
function extractImageUrls(obj: unknown, urls: Set<string> = new Set()): Set<string> {
    if (!obj) return urls;
    if (typeof obj === 'string') {
        if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|avif)/i.test(obj) ||
            /i\.ibb\.co|i\.imgbb\.com|image\.ibb\.co/i.test(obj)) {
            urls.add(obj);
        }
        return urls;
    }
    if (Array.isArray(obj)) {
        for (const item of obj) extractImageUrls(item, urls);
        return urls;
    }
    if (typeof obj === 'object') {
        for (const value of Object.values(obj as Record<string, unknown>)) {
            extractImageUrls(value, urls);
        }
    }
    return urls;
}

// ─── Purge Cloudflare CDN cache ───
async function purgeCloudflareCache(env: Env, baseUrl: string) {
    if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ZONE_ID) return;

    try {
        await fetch(
            `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: [
                        `${baseUrl}/api/content?lang=en`,
                        `${baseUrl}/api/content?lang=bn`,
                        `${baseUrl}/api/ai?action=context&lang=en`,
                        `${baseUrl}/api/ai?action=context&lang=bn`,
                    ],
                }),
            }
        );
    } catch (err) {
        console.error('Cloudflare cache purge failed:', err);
    }
}

// ─── Action: Login ───
async function handleLogin(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, request, 405);
    }

    const { signToken } = await import('../_lib/auth');
    const bcrypt = await import('bcryptjs');
    const { decryptPayload, timingSafeEqual } = await import('../_lib/crypto');
    
    const body = await request.json() as any;
    let code: string | undefined;
    let email: string | undefined;

    // Support both encrypted payload and raw unencrypted requests (for backward compatibility if needed)
    if (body.payload) {
        // Prefer PAYLOAD_SECRET if defined, fallback to JWT_SECRET, then a hardcoded stable key for reliability
        const secret = env.PAYLOAD_SECRET || env.JWT_SECRET || 'orbit-admin-jwt-secret-2025'; 
        const decrypted = await decryptPayload(body.payload, secret);
        if (decrypted) {
            code = decrypted.code;
            email = decrypted.email;
        }
    } else {
        code = body.code;
        email = body.email;
    }

    if (!code) return jsonResponse({ error: 'Access code required' }, request, 400);

    const db = getDb(env);
    const adminEmail = email || env.ADMIN_EMAIL || 'admin@orbitsaas.com';

    // 1. Try to find user in DB
    const result = await db.execute({
        sql: 'SELECT password_hash FROM admin_users WHERE email = ?',
        args: [adminEmail],
    });

    let isValid = false;
    if (result.rows.length > 0) {
        const hash = result.rows[0].password_hash as string;
        isValid = await bcrypt.compare(code, hash);
    } else {
        // 2. Fallback to static access code ONLY IF the email matches the authorized admin email 
        // AND the user is not in the DB yet (e.g. before initial seeding).
        const authorizedEmail = env.ADMIN_EMAIL || 'admin@orbitsaas.com';
        if (adminEmail !== authorizedEmail) {
            return jsonResponse({ error: 'Unauthorized email' }, request, 401);
        }

        if (!env.ADMIN_ACCESS_CODE) return jsonResponse({ error: 'ADMIN_ACCESS_CODE not configured' }, request, 500);
        isValid = timingSafeEqual(code, env.ADMIN_ACCESS_CODE);
    }

    if (!isValid) return jsonResponse({ error: 'Invalid access code' }, request, 401);

    const token = await signToken({ id: 'admin', email: adminEmail }, env.JWT_SECRET);
    return jsonResponse({ success: true, token }, request);
}

// ─── Action: Cache (GET/POST/DELETE with streamed progress) ───
async function handleCache(request: Request, env: Env): Promise<Response> {
    const db = getDb(env);

    // GET: Check cache status
    if (request.method === 'GET') {
        const result = await db.execute('SELECT lang, updated_at FROM content_cache ORDER BY lang');
        const status: Record<string, string> = {};
        for (const row of result.rows) {
            status[row.lang as string] = row.updated_at as string;
        }
        return jsonResponse({
            success: true,
            cached: Object.keys(status).length > 0,
            languages: status,
        }, request);
    }

    // POST: Build cache + warm images (streamed NDJSON progress)
    if (request.method === 'POST') {
        if (!(await isAuthorized(request, env.JWT_SECRET))) {
            return jsonResponse({ error: 'Unauthorized' }, request, 401);
        }

        const corsHeaders = getCorsHeaders(request);
        const encoder = new TextEncoder();
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        const sendProgress = async (progress: number, status: string, extra?: Record<string, unknown>) => {
            await writer.write(encoder.encode(JSON.stringify({ progress: Math.round(progress), status, ...extra }) + '\n'));
        };

        const baseUrl = `https://${new URL(request.url).hostname}`;

        // Run cache build in background, streaming progress
        (async () => {
            try {
                await sendProgress(2, 'Preparing cache table...');
                await db.execute(`
          CREATE TABLE IF NOT EXISTS content_cache (
            lang TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at TEXT DEFAULT (datetime('now'))
          )
        `);
                await sendProgress(5, 'Cache table ready');

                const languages = ['en', 'bn'];
                const allImageUrls = new Set<string>();

                for (let li = 0; li < languages.length; li++) {
                    const lang = languages[li];
                    const langProgress = 5 + ((li + 0.5) / languages.length) * 35;
                    await sendProgress(langProgress, `Caching ${lang.toUpperCase()} content...`);

                    const result = await db.execute({
                        sql: 'SELECT section, data FROM site_content WHERE lang = ?',
                        args: [lang],
                    });

                    const content: Record<string, unknown> = {};
                    for (const row of result.rows) {
                        const parsed = JSON.parse(row.data as string);
                        content[row.section as string] = parsed;
                        extractImageUrls(parsed, allImageUrls);
                    }

                    await db.execute({
                        sql: `INSERT INTO content_cache (lang, data, updated_at)
                  VALUES (?, ?, datetime('now'))
                  ON CONFLICT(lang) DO UPDATE SET data = ?, updated_at = datetime('now')`,
                        args: [lang, JSON.stringify(content), JSON.stringify(content)],
                    });

                    const langDoneProgress = 5 + ((li + 1) / languages.length) * 35;
                    await sendProgress(langDoneProgress, `${lang.toUpperCase()} content cached`);
                }

                await sendProgress(42, 'Clearing AI gists...');
                try { await db.execute('DELETE FROM kb_gist'); } catch { /* skip */ }
                await sendProgress(45, 'AI gists cleared');

                // Warm images
                const imageUrls = Array.from(allImageUrls);
                let imagesWarmed = 0;

                if (imageUrls.length > 0) {
                    const batchSize = 5;
                    const totalBatches = Math.ceil(imageUrls.length / batchSize);
                    for (let i = 0; i < imageUrls.length; i += batchSize) {
                        const batchIndex = Math.floor(i / batchSize);
                        const batchProgress = 45 + ((batchIndex + 0.5) / totalBatches) * 35;
                        await sendProgress(batchProgress, `Warming images ${i + 1}-${Math.min(i + batchSize, imageUrls.length)} of ${imageUrls.length}...`);

                        const batch = imageUrls.slice(i, i + batchSize);
                        await Promise.allSettled(
                            batch.map(url =>
                                fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
                                    .then(r => { if (r.ok) imagesWarmed++; })
                            )
                        );
                        const batchDoneProgress = 45 + ((batchIndex + 1) / totalBatches) * 35;
                        await sendProgress(batchDoneProgress, `Warmed ${imagesWarmed} images so far`);
                    }
                } else {
                    await sendProgress(80, 'No images to warm');
                }

                // Purge Cloudflare CDN cache so fresh content is served
                await sendProgress(85, 'Purging CDN cache...');
                await purgeCloudflareCache(env, baseUrl);
                await sendProgress(90, 'CDN cache purged');

                // Warm CDN cache
                await sendProgress(92, 'Warming CDN cache...');
                try {
                    await Promise.allSettled(
                        languages.map(lang =>
                            fetch(`${baseUrl}/api/content?lang=${lang}`, {
                                method: 'GET',
                                signal: AbortSignal.timeout(5000),
                            })
                        )
                    );
                } catch { /* best effort */ }
                await sendProgress(98, 'CDN cache warmed');

                await sendProgress(100, 'Cache published successfully', {
                    done: true,
                    cachedAt: new Date().toISOString(),
                    imagesFound: imageUrls.length,
                    imagesWarmed,
                });
            } catch (err) {
                console.error('Cache build error:', err);
                await sendProgress(100, 'Cache build failed', { done: true, error: String(err) });
            } finally {
                await writer.close();
            }
        })();

        return new Response(readable, {
            status: 200,
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache',
                ...corsHeaders,
            },
        });
    }

    // DELETE: Clear all cache (streamed progress)
    if (request.method === 'DELETE') {
        if (!(await isAuthorized(request, env.JWT_SECRET))) {
            return jsonResponse({ error: 'Unauthorized' }, request, 401);
        }

        const corsHeaders = getCorsHeaders(request);
        const encoder = new TextEncoder();
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        const sendProgress = async (progress: number, status: string, extra?: Record<string, unknown>) => {
            await writer.write(encoder.encode(JSON.stringify({ progress: Math.round(progress), status, ...extra }) + '\n'));
        };

        const baseUrl = `https://${new URL(request.url).hostname}`;

        (async () => {
            try {
                await sendProgress(10, 'Clearing content cache...');
                let rowsDeleted = 0;
                try {
                    const result = await db.execute('DELETE FROM content_cache');
                    rowsDeleted = result.rowsAffected;
                } catch { /* skip */ }
                await sendProgress(40, 'Content cache cleared');

                await sendProgress(50, 'Clearing AI gists...');
                try { await db.execute('DELETE FROM kb_gist'); } catch { /* skip */ }
                await sendProgress(70, 'AI gists cleared');

                // Purge CDN cache too
                await sendProgress(80, 'Purging CDN cache...');
                await purgeCloudflareCache(env, baseUrl);
                await sendProgress(90, 'CDN cache purged');

                await sendProgress(100, 'Cache cleared successfully', {
                    done: true,
                    rowsDeleted,
                    clearedAt: new Date().toISOString(),
                });
            } catch (err) {
                console.error('Cache clear error:', err);
                await sendProgress(100, 'Cache clear failed', { done: true, error: String(err) });
            } finally {
                await writer.close();
            }
        })();

        return new Response(readable, {
            status: 200,
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache',
                ...corsHeaders,
            },
        });
    }

    return jsonResponse({ error: 'Method not allowed' }, request, 405);
}

// ─── Action: Seed ───
async function handleSeed(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    // SECURITY: handleSeed should be protected by JWT auth if already seeded, 
    // or by ADMIN_ACCESS_CODE if it's the first initialization.
    const isAuth = await isAuthorized(request, env.JWT_SECRET);
    const body = await request.json() as { code?: string };
    const { code } = body;

    if (!isAuth && (!env.ADMIN_ACCESS_CODE || code !== env.ADMIN_ACCESS_CODE)) {
        return jsonResponse({ error: 'Unauthorized' }, request, 401);
    }

    const db = getDb(env);
    const bcrypt = await import('bcryptjs');

    // Dynamic import of translations
    const { translations } = await import('../../../frontend/src/lib/i18n');

    await db.execute(`
    CREATE TABLE IF NOT EXISTS site_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT NOT NULL,
      lang TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(section, lang)
    )
  `);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      source TEXT NOT NULL,
      name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS kb_gist (
      lang TEXT PRIMARY KEY,
      gist TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

    const adminEmail = env.ADMIN_EMAIL || 'admin@orbitsaas.com';
    const adminPassword = env.ADMIN_PASSWORD;
    if (!adminPassword) return jsonResponse({ error: 'ADMIN_PASSWORD not configured' }, request, 500);
    const hash = await bcrypt.hash(adminPassword, 10);

    await db.execute({
        sql: 'INSERT OR IGNORE INTO admin_users (email, password_hash) VALUES (?, ?)',
        args: [adminEmail, hash],
    });

    for (const lang of ['en', 'bn'] as const) {
        const content = translations[lang];
        for (const [section, data] of Object.entries(content)) {
            await db.execute({
                sql: 'INSERT OR IGNORE INTO site_content (section, lang, data) VALUES (?, ?, ?)',
                args: [section, lang, JSON.stringify(data)],
            });
        }
    }

    return jsonResponse({ success: true, message: 'Database seeded successfully' }, request);
}

// ─── Main Router ───
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || '';

    try {
        switch (action) {
            case 'login': return await handleLogin(request, env);
            case 'cache': return await handleCache(request, env);
            case 'seed': return await handleSeed(request, env);
            default: return jsonResponse({ error: 'Unknown action. Use ?action=login|cache|seed' }, request, 400);
        }
    } catch (error) {
        console.error('Admin API error:', error);
        return jsonResponse({ error: 'Failed to process admin request' }, request, 500);
    }
};
