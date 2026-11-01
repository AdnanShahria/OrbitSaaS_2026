import { getDb } from '../_lib/db';
import type { Env } from '../_lib/types';

const SITE_URL = 'https://orbitsaas.cloud';
const FALLBACK_OG = `${SITE_URL}/og-banner-v2.png`;

function cleanSlug(raw: string, fallbackTitle?: string): string {
    if (raw && typeof raw === 'string' && raw.trim()) {
        const trimmed = raw.trim();
        if (!/^\d+$/.test(trimmed)) {
            return trimmed.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
        }
    }
    if (fallbackTitle && typeof fallbackTitle === 'string') {
        const slug = fallbackTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        if (slug) return slug;
    }
    return (raw || '').toLowerCase();
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

async function getAchievementBySlug(slug: string, env: Env) {
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
                sql: "SELECT data FROM site_content WHERE section = 'achievements' AND lang = 'en'",
                args: [],
            });
            if (result.rows.length > 0) {
                content = { achievements: JSON.parse(result.rows[0].data as string) };
            }
        }
        const items: any[] = content.achievements?.items || [];
        const normSlug = (slug || '').toLowerCase().trim();

        // 1. Direct match on id, slug, or title slug
        const directMatch = items.find((item: any) => 
            (item.id && String(item.id).toLowerCase() === normSlug) ||
            (item.slug && String(item.slug).toLowerCase() === normSlug) ||
            cleanSlug(item.id, item.title) === normSlug
        );
        if (directMatch) return directMatch;

        // 2. Numeric index fallback
        const idx = parseInt(normSlug, 10);
        if (!isNaN(idx) && idx >= 0 && idx < items.length) return items[idx];
        return null;
    } catch (e) {
        console.error('OG achievement: DB fetch error', e);
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
 * Catch-all handler for /achievement/* routes.
 * - For bots → serve OG meta HTML with achievement thumbnail/poster
 * - For browsers → serve the SPA (index.html via ASSETS binding)
 */
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const url = new URL(request.url);

    // Extract slug from path: /achievement/achievement-12345 → "achievement-12345"
    const pathParts = (params.path as string[]) || [];
    const slug = pathParts.join('/');

    if (!slug) {
        return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
    }

    const ua = request.headers.get('user-agent') || '';
    const isBot = BOT_UA.test(ua);

    // Real browsers: serve the SPA
    if (!isBot) {
        return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
    }

    // Bots: serve minimal HTML with achievement OG meta tags
    const item = await getAchievementBySlug(slug, env);
    const title = item ? `${item.title} | ORBIT SaaS Achievements` : 'Achievement | ORBIT SaaS';
    const desc = stripHtml(item?.desc || item?.description || item?.tagline || 'Team ORBIT SaaS hackathon victory, milestone, and recognition in technology and innovation.').substring(0, 160);
    
    // Prioritize seoCover / shareImage (poster with top-right logo), then thumbnail/image, then fallback
    const rawImage = item?.seoCover || item?.shareImage || item?.sharePoster || item?.ogImage || item?.image || item?.thumbnail || item?.images?.[0];
    const ogImageUrl = extractImageUrl(rawImage) || FALLBACK_OG;
    const canonicalUrl = `${SITE_URL}/achievement/${slug}`;

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        'headline': title,
        'description': desc,
        'image': [ogImageUrl],
        'url': canonicalUrl,
        'publisher': {
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
<meta name="robots" content="index, follow, max-image-preview:large">

<!-- Open Graph / Facebook / WhatsApp -->
<meta property="og:type" content="article">
<meta property="og:site_name" content="ORBIT SaaS">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${escapeHtml(ogImageUrl)}">
<meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(title)}">
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
<img src="${escapeHtml(ogImageUrl)}" alt="${escapeHtml(title)}" />
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

