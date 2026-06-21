import { getDb } from '../_lib/db';
import type { Env } from '../_lib/types';

const SITE_URL = 'https://orbitsaas.cloud';
const FALLBACK_OG = `${SITE_URL}/og-banner-v2.png`;

async function getItemBySlug(slug: string, env: Env) {
    const db = getDb(env);
    try {
        const cacheResult = await db.execute({
            sql: 'SELECT data FROM content_cache WHERE lang = ?',
            args: ['en'],
        });
        let content: any = {};
        if (cacheResult.rows.length > 0) {
            content = JSON.parse(cacheResult.rows[0].data as string);
        } else {
            const pResult = await db.execute({
                sql: "SELECT data FROM site_content WHERE section = 'projects' AND lang = 'en'",
                args: [],
            });
            if (pResult.rows.length > 0) {
                content.projects = JSON.parse(pResult.rows[0].data as string);
            }
            const aResult = await db.execute({
                sql: "SELECT data FROM site_content WHERE section = 'achievements' AND lang = 'en'",
                args: [],
            });
            if (aResult.rows.length > 0) {
                content.achievements = JSON.parse(aResult.rows[0].data as string);
            }
        }

        const pItems: any[] = content.projects?.items || [];
        const aItems: any[] = content.achievements?.items || [];

        // Slug-based lookup first
        const bySlug = pItems.find((i: any) => i.id === slug) || aItems.find((i: any) => i.id === slug);
        if (bySlug) return bySlug;

        // Numeric index fallback
        const idx = parseInt(slug, 10);
        if (!isNaN(idx)) {
            return pItems[idx] || aItems[idx] || null;
        }
        return null;
    } catch (e) {
        console.error('OG: DB fetch error', e);
        return null;
    }
}

/**
 * GET /api/og?project=<slug>  or  /api/og?achievement=<slug>
 *
 * Returns a 1200×630 OG image with the OrbitSaaS watermark badge overlaid
 * in the bottom-right corner, using Cloudflare Image Resizing natively.
 *
 * Requires: Cloudflare Image Resizing enabled on the zone (Pro plan+).
 * Falls back gracefully to the raw cover image if the slug resolves.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const slug = url.searchParams.get('project') || url.searchParams.get('achievement') || '';

    if (!slug) {
        return Response.redirect(FALLBACK_OG, 302);
    }

    const item = await getItemBySlug(slug, env);
    const rawCoverUrl = item?.images?.[0] || item?.image || '';

    if (!rawCoverUrl) {
        return Response.redirect(FALLBACK_OG, 302);
    }

    const coverUrl = rawCoverUrl.startsWith('http') ? rawCoverUrl : `https://${rawCoverUrl}`;

    // -------------------------------------------------------------------
    // Cloudflare Image Resizing — no 3rd-party libs needed.
    // The `draw` sub-option URL must be percent-encoded separately from
    // the top-level option string (top-level uses commas as delimiters).
    // draw sub-options use semicolons as delimiters.
    // -------------------------------------------------------------------
    const logoUrl = encodeURIComponent(`${SITE_URL}/orbit-logo.png`);
    const draw = `url:${logoUrl};bottom:40;right:40;opacity:0.9;fit:contain;width:280`;
    const cfOptions = `width=1200,height=630,fit=crop,format=jpeg,quality=85,draw=${draw}`;
    const cfImageUrl = `${SITE_URL}/cdn-cgi/image/${cfOptions}/${coverUrl}`;

    return Response.redirect(cfImageUrl, 302);
};
