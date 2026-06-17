import { getDb } from '../_lib/db';
import { getCorsHeaders, handleOptions, jsonResponse } from '../_lib/cors';
import { isAuthorized, getAdminIdentity } from '../_lib/auth';
import { ensureAuditTable, logAudit, getRequestMeta } from '../_lib/audit';
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

function generateChangesSummary(section: string, lang: string, oldData: any, newData: any): string {
    const defaultSummary = `Updated ${section} content for ${lang === 'en' ? 'English' : 'বাংলা'}`;
    if (!oldData || typeof oldData !== 'object' || !newData || typeof newData !== 'object') {
        return defaultSummary;
    }

    const changes: string[] = [];

    // 1. Check section-level 'visible' toggle (used in projects)
    if ('visible' in oldData || 'visible' in newData) {
        const oldVisible = oldData.visible !== false;
        const newVisible = newData.visible !== false;
        if (oldVisible !== newVisible) {
            changes.push(newVisible ? "Enabled section visibility" : "Disabled section visibility");
        }
    }

    // 2. Identify array-like properties to compare (items, members, steps)
    let oldItems: any[] = [];
    let newItems: any[] = [];
    let itemType = 'item';

    if (Array.isArray(oldData.items) || Array.isArray(newData.items)) {
        oldItems = Array.isArray(oldData.items) ? oldData.items : [];
        newItems = Array.isArray(newData.items) ? newData.items : [];
        itemType = section === 'projects' ? 'project' : (section === 'reviews' ? 'review' : 'item');
    } else if (Array.isArray(oldData.members) || Array.isArray(newData.members)) {
        oldItems = Array.isArray(oldData.members) ? oldData.members : [];
        newItems = Array.isArray(newData.members) ? newData.members : [];
        itemType = 'member';
    } else if (Array.isArray(oldData.steps) || Array.isArray(newData.steps)) {
        oldItems = Array.isArray(oldData.steps) ? oldData.steps : [];
        newItems = Array.isArray(newData.steps) ? newData.steps : [];
        itemType = 'step';
    }

    if (oldItems.length > 0 || newItems.length > 0) {
        const getItemKey = (item: any, idx: number) => {
            return item.id || item.title || item.name || `index_${idx}`;
        };

        const getItemTitle = (item: any, idx: number) => {
            return item.title || item.name || item.id || `${itemType} #${idx + 1}`;
        };

        const oldItemsMap = new Map<string, { item: any; idx: number }>();
        oldItems.forEach((item, idx) => {
            if (item) oldItemsMap.set(getItemKey(item, idx), { item, idx });
        });

        const newItemsKeys = new Set<string>();
        newItems.forEach((item, idx) => {
            if (!item) return;
            const key = getItemKey(item, idx);
            newItemsKeys.add(key);

            const oldEntry = oldItemsMap.get(key);
            const itemTitle = getItemTitle(item, idx);

            if (!oldEntry) {
                changes.push(`Added ${itemType} "${itemTitle}"`);
            } else {
                const oldItem = oldEntry.item;
                const oldHidden = !!oldItem.hidden;
                const newHidden = !!item.hidden;
                if (oldHidden !== newHidden) {
                    changes.push(newHidden ? `Disabled visibility for ${itemType} "${itemTitle}"` : `Enabled visibility for ${itemType} "${itemTitle}"`);
                } else {
                    const keysToCheck = ['title', 'name', 'desc', 'text', 'role', 'link', 'rating'];
                    let itemChanged = false;
                    for (const k of keysToCheck) {
                        if (k in oldItem && k in item && oldItem[k] !== item[k]) {
                            itemChanged = true;
                            break;
                        }
                    }
                    if (itemChanged) {
                        changes.push(`Updated details for ${itemType} "${itemTitle}"`);
                    }
                }
            }
        });

        // Check for deleted items
        oldItems.forEach((item, idx) => {
            if (!item) return;
            const key = getItemKey(item, idx);
            if (!newItemsKeys.has(key)) {
                const itemTitle = getItemTitle(item, idx);
                changes.push(`Deleted ${itemType} "${itemTitle}"`);
            }
        });
    }

    // 3. Check simple root-level changes if no item changes detected
    if (changes.length === 0) {
        const rootKeys = ['title', 'subtitle', 'badge', 'heading', 'showSocials'];
        for (const k of rootKeys) {
            if (oldData && newData && k in oldData && k in newData && oldData[k] !== newData[k]) {
                changes.push(`Updated ${k}`);
            }
        }
    }

    if (changes.length > 0) {
        if (changes.length > 4) {
            return `Updated multiple elements in ${section} section: ${changes.slice(0, 3).join(', ')} and ${changes.length - 3} more changes`;
        }
        return changes.join(', ');
    }

    return defaultSummary;
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

            // Get existing data before update for audit log comparison
            let oldData: any = null;
            try {
                const existing = await db.execute({
                    sql: 'SELECT data FROM site_content WHERE section = ? AND lang = ?',
                    args: [section, lang],
                });
                if (existing.rows.length > 0) {
                    oldData = JSON.parse(existing.rows[0].data as string);
                }
            } catch {
                // Ignore errors reading existing content
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

            // Audit log: track who updated which section
            try {
                await ensureAuditTable(env);
                const adminEmail = await getAdminIdentity(request, env.JWT_SECRET);
                const meta = getRequestMeta(request);
                const summary = generateChangesSummary(section, lang, oldData, data);
                await logAudit(env, {
                    admin_email: adminEmail || 'unknown',
                    action: 'update',
                    entity_type: 'content',
                    entity_id: `${section}:${lang}`,
                    entity_label: `${section.charAt(0).toUpperCase() + section.slice(1)} Section (${lang.toUpperCase()})`,
                    changes_summary: summary,
                    ...meta,
                });
            } catch { /* audit is non-critical */ }

            return jsonResponse({ success: true }, request);
        }

        return jsonResponse({ error: 'Method not allowed' }, request, 405);
    } catch (error) {
        console.error('Content API error:', error);
        return jsonResponse({ error: 'Internal server error' }, request, 500);
    }
};
