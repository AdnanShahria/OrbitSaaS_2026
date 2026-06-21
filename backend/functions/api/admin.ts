import { getDb } from '../_lib/db';
import { getCorsHeaders, handleOptions, jsonResponse } from '../_lib/cors';
import { isAuthorized, getAdminIdentity } from '../_lib/auth';
import { ensureAuditTable, logAudit, getRequestMeta } from '../_lib/audit';
import type { Env } from '../_lib/types';
import { sendMail } from '../_lib/mail';

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

// ─── OTP Email Helper ───
async function sendAdminLoginOtpEmail(env: Env, otp: string, targetEmail: string) {
    const subject = "Admin Access - Authorization Code";
    const text = `Your ORBIT SaaS admin login code is: ${otp}`;
    const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6c5ce7; margin: 0; font-size: 28px; font-weight: 800;">ORBIT SaaS Admin</h1>
      </div>
      <div style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #eef0f6;">
        <h2 style="margin-top: 0; font-size: 22px; color: #1a1a2e;">Admin Login Authorization</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #64648a;">
          You requested to log into the ORBIT SaaS admin panel. Please use the following One-Time Password to proceed. This code expires in 10 minutes.
        </p>
        <div style="margin-top: 30px; margin-bottom: 30px; text-align: center;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a1a2e; background: #f3f4f6; padding: 10px 20px; border-radius: 8px;">${otp}</span>
        </div>
        <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eef0f6; text-align: center;">
          <p style="font-size: 14px; color: #8888a0; margin: 0;">
            If you did not request this, please secure your admin panel immediately.<br>
            <strong>The ORBIT SaaS Team</strong>
          </p>
        </div>
      </div>
    </div>
    `;

    await sendMail(env, {
        to: targetEmail,
        subject,
        text,
        html,
        fromName: "ORBIT SaaS Admin"
    });
}

// ─── Action: Login OTP Send ───
async function handleLoginOtpSend(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const body = await request.json() as { email?: string };
    const { email } = body;

    const AUTHORIZED_EMAILS = [
        'adnanshahria2019@gmail.com',
        'abdurrafiu7@gmail.com',
        'nisarfeni2015@gmail.com',
        'artalha100@gmail.com'
    ];

    if (!email || !AUTHORIZED_EMAILS.includes(email)) {
        return jsonResponse({ error: 'Unauthorized email address' }, request, 403);
    }

    const db = getDb(env);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS login_otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    )
    `);

    // Clean up expired OTPs
    await db.execute(`DELETE FROM login_otps WHERE datetime('now') > expires_at`);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await db.execute({
        sql: `INSERT INTO login_otps (email, code, expires_at) VALUES (?, ?, datetime('now', '+10 minutes'))`,
        args: [email, otp],
    });

    await sendAdminLoginOtpEmail(env, otp, email);

    return jsonResponse({ success: true, message: 'OTP sent to email' }, request);
}

// ─── Action: Login OTP Verify ───
async function handleLoginOtpVerify(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const { signToken } = await import('../_lib/auth');
    const body = await request.json() as { email?: string; code?: string };
    const { email, code } = body;

    if (!email || !code) {
        return jsonResponse({ error: 'Email and code are required' }, request, 400);
    }

    const db = getDb(env);

    // Delete expired OTPs
    await db.execute(`DELETE FROM login_otps WHERE datetime('now') > expires_at`);

    const result = await db.execute({
        sql: `SELECT id FROM login_otps WHERE email = ? AND code = ?`,
        args: [email, code],
    });

    if (result.rows.length === 0) {
        return jsonResponse({ error: 'Invalid or expired OTP' }, request, 401);
    }

    // Delete used OTP
    const otpId = result.rows[0].id;
    await db.execute({
        sql: `DELETE FROM login_otps WHERE id = ?`,
        args: [otpId],
    });

    // Generate token
    const token = await signToken({ id: 'admin', email }, env.JWT_SECRET);

    // Log to audit trail
    const meta = getRequestMeta(request);
    await logAudit(env, {
        admin_email: email,
        action: 'login',
        entity_type: 'auth',
        entity_label: 'Admin login via OTP',
        ...meta,
    });

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

                // Log cache publish to audit trail
                const adminEmail = await getAdminIdentity(request, env.JWT_SECRET);
                const meta = getRequestMeta(request);
                await logAudit(env, {
                    admin_email: adminEmail || 'unknown',
                    action: 'cache_publish',
                    entity_type: 'cache',
                    entity_label: `Published cache (${imageUrls.length} images warmed)`,
                    ...meta,
                });

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

                // Log cache delete to audit trail
                const adminEmail = await getAdminIdentity(request, env.JWT_SECRET);
                const meta = getRequestMeta(request);
                await logAudit(env, {
                    admin_email: adminEmail || 'unknown',
                    action: 'cache_delete',
                    entity_type: 'cache',
                    entity_label: `Deleted cache (${rowsDeleted} rows)`,
                    ...meta,
                });

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
    const { translations } = await import('../_lib/i18n');

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

    // Also ensure audit log table exists
    await ensureAuditTable(env);

    // Log the seed action
    const meta = getRequestMeta(request);
    await logAudit(env, {
        admin_email: adminEmail,
        action: 'seed',
        entity_type: 'system',
        entity_label: 'Database seeded',
        ...meta,
    });

    return jsonResponse({ success: true, message: 'Database seeded successfully' }, request);
}

// ─── Action: Audit Log (GET) ───
async function handleAuditLog(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    await ensureAuditTable(env);

    const db = getDb(env);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const filterAction = url.searchParams.get('action_type') || '';
    const filterEntity = url.searchParams.get('entity_type') || '';
    const filterAdmin = url.searchParams.get('admin') || '';
    const search = url.searchParams.get('search') || '';
    const dateFrom = url.searchParams.get('from') || '';
    const dateTo = url.searchParams.get('to') || '';

    let whereClause = '1=1';
    const args: any[] = [];

    if (filterAction) { whereClause += ` AND action = ?`; args.push(filterAction); }
    if (filterEntity) { whereClause += ` AND entity_type = ?`; args.push(filterEntity); }
    if (filterAdmin) { whereClause += ` AND admin_email = ?`; args.push(filterAdmin); }
    if (search) { whereClause += ` AND (entity_label LIKE ? OR changes_summary LIKE ? OR admin_email LIKE ?)`; args.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (dateFrom) { whereClause += ` AND created_at >= ?`; args.push(dateFrom); }
    if (dateTo) { whereClause += ` AND created_at <= ?`; args.push(dateTo + ' 23:59:59'); }

    const countRes = await db.execute({ sql: `SELECT COUNT(*) as count FROM admin_audit_log WHERE ${whereClause}`, args });
    const total = Number(countRes.rows[0]?.count ?? 0);

    const result = await db.execute({
        sql: `SELECT * FROM admin_audit_log WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        args: [...args, limit, offset],
    });

    // Get unique admins for filter dropdown
    const adminsRes = await db.execute(`SELECT DISTINCT admin_email FROM admin_audit_log ORDER BY admin_email`);
    const admins = adminsRes.rows.map(r => r.admin_email as string);

    // Get unique entity types for filter dropdown
    const entityTypesRes = await db.execute(`SELECT DISTINCT entity_type FROM admin_audit_log ORDER BY entity_type`);
    const entityTypes = entityTypesRes.rows.map(r => r.entity_type as string);

    // Recent admin activity summary
    const recentActivityRes = await db.execute(`
        SELECT admin_email, MAX(created_at) as last_seen, COUNT(*) as total_actions
        FROM admin_audit_log
        GROUP BY admin_email
        ORDER BY last_seen DESC
    `);

    return jsonResponse({
        success: true,
        logs: result.rows,
        total,
        page,
        limit,
        admins,
        entityTypes,
        adminActivity: recentActivityRes.rows,
    }, request);
}

// ─── Main Router ───
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || '';

    try {
        switch (action) {
            case 'login-send': return await handleLoginOtpSend(request, env);
            case 'login-verify': return await handleLoginOtpVerify(request, env);
            case 'cache': return await handleCache(request, env);
            case 'seed': return await handleSeed(request, env);
            case 'audit': {
                if (!(await isAuthorized(request, env.JWT_SECRET))) {
                    return jsonResponse({ error: 'Unauthorized' }, request, 401);
                }
                return await handleAuditLog(request, env);
            }
            default: return jsonResponse({ error: 'Unknown action. Use ?action=login-send|login-verify|cache|seed|audit' }, request, 400);
        }
    } catch (error) {
        console.error('Admin API error:', error);
        return jsonResponse({ error: 'Failed to process admin request' }, request, 500);
    }
};
