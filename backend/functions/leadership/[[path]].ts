import { getDb } from '../_lib/db';
import type { Env } from '../_lib/types';

const SITE_URL = 'https://orbitsaas.cloud';
const FALLBACK_OG = `${SITE_URL}/og-banner-v2.png`;

function slugify(name: string): string {
    return (name || '')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

function extractImageUrl(raw: any): string {
    if (!raw) return '';
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return extractImageUrl(parsed);
            } catch {
                // not json
            }
        }
        if (trimmed.includes('|||')) {
            const first = trimmed.split('|||')[0].trim();
            return first.startsWith('http') ? first : `${SITE_URL}${first.startsWith('/') ? '' : '/'}${first}`;
        }
        return trimmed.startsWith('http') ? trimmed : `${SITE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
    }
    if (typeof raw === 'object' && raw !== null) {
        const primary = raw.primary || raw.url || raw.src || raw.fallback;
        return extractImageUrl(primary);
    }
    return '';
}

async function getMemberBySlug(slug: string, env: Env) {
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
                sql: "SELECT data FROM site_content WHERE section = 'leadership' AND lang = 'en'",
                args: [],
            });
            if (result.rows.length > 0) {
                content = { leadership: JSON.parse(result.rows[0].data as string) };
            }
        }
        const members: any[] = content.leadership?.members || [];
        const normSlug = (slug || '').toLowerCase().trim();

        // 1. Match by id, slug, or slugified name
        const match = members.find((m: any) => 
            (m.id && String(m.id).toLowerCase() === normSlug) ||
            (m.slug && String(m.slug).toLowerCase() === normSlug) ||
            slugify(m.name) === normSlug
        );
        if (match) return match;

        // 2. Numeric index fallback
        const idx = parseInt(normSlug, 10);
        if (!isNaN(idx) && idx >= 0 && idx < members.length) return members[idx];
        return null;
    } catch (e) {
        console.error('OG leadership: DB fetch error', e);
        return null;
    }
}

function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function escapeHtml(str: string): string {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ── Known bot user-agents ── */
const BOT_UA = /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|telegram|twitterbot|linkedinbot|slackbot|discordbot|googlebot|bingbot|yandex|baidu|duckduck|sogou|exabot|ia_archiver|embedly|quora|outbrain|pinterest|vkshare|tumblr|skype|nuzzel|w3c_validator|preview/i;

/**
 * Catch-all handler for /leadership routes.
 * Supports:
 * - /leadership?member=<slug>
 * - /leadership/<slug>
 * 
 * - For bots → serve OG meta HTML with member's profile/poster
 * - For browsers:
 *   - If accessed via /leadership/<slug>, redirect to /leadership?member=<slug> so SPA modal opens
 *   - If accessed via /leadership?member=..., serve SPA (index.html via ASSETS binding)
 */
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const url = new URL(request.url);

    // Extract member slug either from query param (?member=slug) or path (/leadership/slug)
    const pathParts = (params.path as string[]) || [];
    const pathSlug = pathParts.join('/');
    const memberSlug = url.searchParams.get('member') || pathSlug;

    // Real browsers:
    const ua = request.headers.get('user-agent') || '';
    const isBot = BOT_UA.test(ua);

    if (!isBot) {
        // If accessed via /leadership/slug, redirect browser to /leadership?member=slug
        if (pathSlug && !url.searchParams.has('member')) {
            const redirectUrl = new URL('/leadership', request.url);
            redirectUrl.searchParams.set('member', pathSlug);
            return Response.redirect(redirectUrl.toString(), 302);
        }
        // Otherwise serve SPA
        return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
    }

    // Bots:
    if (!memberSlug) {
        // Generic leadership page bot response
        return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
    }

    const member = await getMemberBySlug(memberSlug, env);
    const memberName = member?.name || 'Leadership Team';
    const memberRole = member?.role || 'Team Member';
    const title = member ? `${memberName} - ${memberRole} | ORBIT SaaS` : 'Leadership Team | ORBIT SaaS';
    const desc = stripHtml(member?.bio || member?.subDetail || `${memberName} is a key leader and innovator at ORBIT SaaS driving engineering excellence.`).substring(0, 160);
    
    // Prioritize shareImage (poster with top-right logo), then member photo, then fallback
    const rawImage = member?.shareImage || member?.sharePoster || member?.ogImage || member?.image;
    const ogImageUrl = extractImageUrl(rawImage) || FALLBACK_OG;
    const canonicalUrl = `${SITE_URL}/leadership?member=${encodeURIComponent(memberSlug)}`;

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': memberName,
        'jobTitle': memberRole,
        'description': desc,
        'image': ogImageUrl,
        'url': canonicalUrl,
        'worksFor': {
            '@type': 'Organization',
            'name': 'ORBIT SaaS',
            'url': SITE_URL
        }
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
<link rel="icon" type="image/png" href="${SITE_URL}/favicon.png">

<!-- Open Graph / Facebook / WhatsApp -->
<meta property="og:type" content="profile">
<meta property="og:site_name" content="ORBIT SaaS">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${escapeHtml(ogImageUrl)}">
<meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@orbitsaas">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}">

<!-- Structured Data -->
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(desc)}</p>
<img src="${escapeHtml(ogImageUrl)}" alt="${escapeHtml(memberName)}" />
</body>
</html>`;

    return new Response(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            'X-Robots-Tag': 'all, index, follow',
        },
    });
};

