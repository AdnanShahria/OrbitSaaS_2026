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
        }
        const items: any[] = content.projects?.items || [];
        const project = items.find((item: any) => item.id === slug);
        if (project) return project;
        const idx = parseInt(slug, 10);
        if (!isNaN(idx) && idx >= 0 && idx < items.length) return items[idx];
        return null;
    } catch (e) {
        console.error('OG: DB fetch error', e);
        return null;
    }
}

/**
 * /api/og?project=slug — Returns the project cover image (redirect).
 * Used as the og:image URL in meta tags.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const slug = url.searchParams.get('project') || '';

    if (!slug) {
        return new Response('Missing project parameter', { status: 400 });
    }

    const project = await getProjectBySlug(slug, env);
    const coverUrl = project?.images?.[0] || project?.image || '';

    if (!coverUrl) {
        return Response.redirect(FALLBACK_OG, 302);
    }

    const absoluteUrl = coverUrl.startsWith('http') ? coverUrl : `https://${coverUrl}`;

    return Response.redirect(absoluteUrl, 302);
};
