import { getCorsHeaders, handleOptions, jsonResponse } from '../../../_lib/cors';
import type { Env } from '../../../_lib/types';

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);
    
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return jsonResponse({ error: 'Method not allowed' }, request, 405);
    }

    // params.path is an array for catch-all routes [[path]].ts
    const pathArray = params.path as string[] | undefined;
    if (!pathArray || pathArray.length === 0) {
        return jsonResponse({ error: 'Not found' }, request, 404);
    }

    const objectKey = pathArray.join('/');

    if (!env.IMAGE_BUCKET) {
        console.error("R2 IMAGE_BUCKET binding missing");
        return jsonResponse({ error: 'Storage not configured properly' }, request, 500);
    }

    try {
        const object = await env.IMAGE_BUCKET.get(objectKey);

        if (object === null) {
            return jsonResponse({ error: 'Not found' }, request, 404);
        }

        const headers = new Headers();
        // Add CORS headers so the images can be drawn in canvas etc if needed
        const corsHeaders = getCorsHeaders(request);
        for (const [key, value] of Object.entries(corsHeaders)) {
             headers.set(key, value);
        }

        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        
        // Ensure browser caching is effective
        if (!headers.has('cache-control')) {
            headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
        }

        const status = object.body ? 200 : 304;

        if (request.method === 'HEAD') {
             return new Response(null, { headers, status });
        }

        return new Response(object.body, { headers, status });

    } catch (error) {
        console.error('R2 get error:', error);
        return jsonResponse({ error: 'Failed to retrieve image' }, request, 500);
    }
};
