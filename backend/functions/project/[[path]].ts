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

function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Known bot user-agents ── */
const BOT_UA = /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|telegram|twitterbot|linkedinbot|slackbot|discordbot|googlebot|bingbot|yandex|baidu|duckduck|sogou|exabot|ia_archiver|embedly|quora|outbrain|pinterest|vkshare|tumblr|skype|nuzzel|w3c_validator|preview/i;

/**
 * Catch-all handler for /project/* routes.
 * - For bots → serve OG meta HTML
 * - For browsers → serve the SPA (index.html via ASSETS binding)
 */
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const url = new URL(request.url);

    // Extract slug from path: /project/my-project → "my-project"
    const pathParts = (params.path as string[]) || [];
    const slug = pathParts.join('/');

    if (!slug) {
        // No slug — serve the SPA
        return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
    }

    // Check for OG image mode (called by the meta tags)
    const mode = url.searchParams.get('mode');
    if (mode === 'image') {
        // Redirect to project cover image for OG
        const project = await getProjectBySlug(slug, env);
        const coverUrl = project?.images?.[0] || project?.image || '';
        if (!coverUrl) return Response.redirect(FALLBACK_OG, 302);
        const absoluteUrl = coverUrl.startsWith('http') ? coverUrl : `https://${coverUrl}`;
        return Response.redirect(absoluteUrl, 302);
    }

    const ua = request.headers.get('user-agent') || '';
    const isBot = BOT_UA.test(ua);

    // Real browsers: serve the SPA
    if (!isBot) {
        return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
    }

    // Bots: serve minimal HTML with OG meta tags
    const project = await getProjectBySlug(slug, env);
    const title = project?.seo?.title || (project ? `${project.title} | Orbit SaaS` : 'Project | Orbit SaaS');
    const desc = project?.seo?.description || stripHtml(project?.desc || '').substring(0, 160);
    const ogImageUrl = project?.images?.[0] || project?.image || FALLBACK_OG;
    const canonicalUrl = `${SITE_URL}/project/${slug}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${canonicalUrl}">
<link rel="icon" type="image/png" href="${SITE_URL}/favicon.png">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${ogImageUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:site_name" content="ORBIT SaaS">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="twitter:image" content="${ogImageUrl}">
</head>
<body><p>${escapeHtml(title)}</p></body>
</html>`;

    return new Response(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
};
