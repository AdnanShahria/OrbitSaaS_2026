import { getDb } from '../_lib/db';
import type { Env } from '../_lib/types';

const SITE_URL = 'https://orbitsaas.cloud';
const FALLBACK_OG = `${SITE_URL}/og-banner-v2.png`;

async function getProjectBySlug(slug: string, env: Env) {
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
            const result = await db.execute({
                sql: "SELECT data FROM site_content WHERE section = 'projects' AND lang = 'en'",
                args: [],
            });
            if (result.rows.length > 0) {
                content = { projects: JSON.parse(result.rows[0].data as string) };
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
        
        let item = pItems.find((i: any) => i.id === slug) || aItems.find((i: any) => i.id === slug);
        if (item) return item;
        
        const idx = parseInt(slug, 10);
        if (!isNaN(idx)) {
            if (pItems[idx]) return pItems[idx];
            if (aItems[idx]) return aItems[idx];
        }
        return null;
    } catch (e) {
        console.error('OG: DB fetch error', e);
        return null;
    }
}

/**
 * /api/og?project=slug — Returns the project cover image overlaid with a watermark (via Cloudflare Image Resizing).
 */
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const slug = url.searchParams.get('project') || url.searchParams.get('achievement') || '';

    if (!slug) {
        return new Response('Missing project parameter', { status: 400 });
    }

    const project = await getProjectBySlug(slug, env);
    const coverUrl = project?.images?.[0] || project?.image || '';

    if (!coverUrl) {
        return Response.redirect(FALLBACK_OG, 302);
    }

    const absoluteUrl = coverUrl.startsWith('http') ? coverUrl : `https://${coverUrl}`;
    
    // Cloudflare Image Resizing to overlay the watermark natively
    // We use the 'draw' option to put the OrbitSaaS logo in the bottom right corner
    const drawOptions = `bottom:40;right:40;opacity:0.9;fit:contain;width:250;url:${SITE_URL}/orbit-logo.png`;
    const cfOptions = `width=1200,height=630,fit=crop,format=auto,draw=${drawOptions}`;
    
    const cfImageUrl = `${SITE_URL}/cdn-cgi/image/${cfOptions}/${absoluteUrl}`;

    return Response.redirect(cfImageUrl, 302);
};
