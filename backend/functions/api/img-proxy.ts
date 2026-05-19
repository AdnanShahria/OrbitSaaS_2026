import { getCorsHeaders, handleOptions, jsonResponse } from '../_lib/cors';
import type { Env } from '../_lib/types';

// Allowed external image domains
const ALLOWED_DOMAINS = ['i.ibb.co', 'i.imgbb.com', 'image.ibb.co'];

function isAllowedUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return ALLOWED_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`));
    } catch {
        return false;
    }
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);
    if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl || !isAllowedUrl(imageUrl)) {
        return jsonResponse({ error: 'Invalid or disallowed image URL' }, request, 400);
    }

    try {
        const upstream = await fetch(imageUrl, {
            headers: { 'Accept': 'image/*' },
        });

        if (!upstream.ok) {
            return jsonResponse({ error: 'Upstream image fetch failed' }, request, upstream.status);
        }

        const contentType = upstream.headers.get('content-type') || 'image/jpeg';

        // Long-lived cache: CDN caches for 1 year, browser caches for 1 day
        return new Response(upstream.body, {
            status: 200,
            headers: {
                ...getCorsHeaders(request),
                'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
                'CDN-Cache-Control': 'public, s-maxage=31536000, immutable',
                'Content-Type': contentType,
            },
        });
    } catch (error) {
        console.error('Image proxy error:', error);
        return jsonResponse({ error: 'Image proxy failed' }, request, 500);
    }
};
