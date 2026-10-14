import { getCorsHeaders, handleOptions, jsonResponse } from '../_lib/cors';
import type { Env } from '../_lib/types';

// Allowed external image domains
const ALLOWED_DOMAINS = ['i.ibb.co', 'i.imgbb.com', 'image.ibb.co', 'orbitsaas.cloud'];

function isAllowedUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') {
            return false;
        }
        return ALLOWED_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`));
    } catch {
        return false;
    }
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);
    if (request.method !== 'GET' && request.method !== 'HEAD') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl || !isAllowedUrl(imageUrl)) {
        return jsonResponse({ error: 'Invalid or disallowed image URL' }, request, 400);
    }

    try {
        const upstream = await fetch(imageUrl, {
            method: request.method,
            headers: { 'Accept': 'image/*' },
        });

        if (!upstream.ok) {
            return jsonResponse({ error: 'Upstream image fetch failed' }, request, upstream.status);
        }

        const contentType = upstream.headers.get('content-type') || 'image/jpeg';
        const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
        if (!ALLOWED_MIME.includes(contentType.toLowerCase().split(';')[0].trim())) {
            return jsonResponse({ error: 'Disallowed upstream content type' }, request, 400);
        }
        const contentLength = upstream.headers.get('content-length');

        const headers: Record<string, string> = {
            ...getCorsHeaders(request),
            'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
            'CDN-Cache-Control': 'public, s-maxage=31536000, immutable',
            'Content-Type': contentType,
        };

        if (contentLength) {
            headers['Content-Length'] = contentLength;
        }

        // Long-lived cache: CDN caches for 1 year, browser caches for 1 day
        return new Response(request.method === 'HEAD' ? null : upstream.body, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Image proxy error:', error);
        return jsonResponse({ error: 'Image proxy failed' }, request, 500);
    }
};
