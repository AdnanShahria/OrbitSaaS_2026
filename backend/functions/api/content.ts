import { getDb } from '../_lib/db';
import { getCorsHeaders, handleOptions, jsonResponse } from '../_lib/cors';
import { isAuthorized } from '../_lib/auth';
import type { Env } from '../_lib/types';

// Simple hash for ETag generation
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);

    const db = getDb(env);
    const url = new URL(request.url);

    try {
        if (request.method === 'GET') {
            const language = url.searchParams.get('lang') || 'en';
            let content: Record<string, unknown> = {};

            // 1. Try reading from pre-built cache first (fast: single row)
            try {
                const cacheResult = await db.execute({
                    sql: 'SELECT data FROM content_cache WHERE lang = ?',
                    args: [language],
                });
                if (cacheResult.rows.length > 0) {
                    content = JSON.parse(cacheResult.rows[0].data as string);
                }
            } catch {
                // content_cache table might not exist yet — fall through
            }

            // 2. Fallback: assemble from individual sections
            if (Object.keys(content).length === 0) {
                const result = await db.execute({
                    sql: 'SELECT section, data FROM site_content WHERE lang = ?',
                    args: [language],
                });
                for (const row of result.rows) {
                    content[row.section as string] = JSON.parse(row.data as string);
                }
            }

            // ETag for conditional caching
            const contentJson = JSON.stringify(content);
            const etag = `"${simpleHash(contentJson)}"`;

            const cacheHeaders: Record<string, string> = {
                'Cache-Control': 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=300',
                'CDN-Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=300',
                'ETag': etag,
            };

            if (request.headers.get('if-none-match') === etag) {
                return new Response(null, {
                    status: 304,
                    headers: { ...getCorsHeaders(request), ...cacheHeaders },
                });
            }

            return jsonResponse(
                { success: true, content, lang: language },
                request,
                200,
                cacheHeaders
            );
        }

        if (request.method === 'POST') {
            if (!(await isAuthorized(request, env.JWT_SECRET))) {
                return jsonResponse({ error: 'Unauthorized' }, request, 401);
            }

            const body = await request.json() as { section?: string; lang?: string; data?: unknown };
            const { section, lang, data } = body;
            if (!section || !lang || !data) {
                return jsonResponse({ error: 'Missing section, lang, or data' }, request, 400);
            }

            await db.execute({
                sql: `INSERT INTO site_content (section, lang, data, updated_at)
              VALUES (?, ?, ?, datetime('now'))
              ON CONFLICT(section, lang) DO UPDATE SET data = ?, updated_at = datetime('now')`,
                args: [section, lang, JSON.stringify(data), JSON.stringify(data)],
            });

            // Rebuild content_cache for this language
            try {
                const allSections = await db.execute({
                    sql: 'SELECT section, data FROM site_content WHERE lang = ?',
                    args: [lang],
                });
                const assembled: Record<string, unknown> = {};
                for (const row of allSections.rows) {
                    assembled[row.section as string] = JSON.parse(row.data as string);
                }
                await db.execute({
                    sql: `INSERT INTO content_cache (lang, data, updated_at)
                VALUES (?, ?, datetime('now'))
                ON CONFLICT(lang) DO UPDATE SET data = ?, updated_at = datetime('now')`,
                    args: [lang, JSON.stringify(assembled), JSON.stringify(assembled)],
                });
            } catch { /* content_cache table might not exist yet */ }

            // Invalidate AI gist
            try {
                await db.execute({ sql: 'DELETE FROM kb_gist WHERE lang = ?', args: [lang] });
            } catch { /* skip */ }

            return jsonResponse({ success: true }, request);
        }

        return jsonResponse({ error: 'Method not allowed' }, request, 405);
    } catch (error) {
        console.error('Content API error:', error);
        return jsonResponse({ error: 'Internal server error' }, request, 500);
    }
};
