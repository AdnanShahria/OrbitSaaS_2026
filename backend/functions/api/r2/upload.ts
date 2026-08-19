import { getCorsHeaders, handleOptions, jsonResponse } from '../../_lib/cors';
import { isAuthorized } from '../../_lib/auth';
import type { Env } from '../../_lib/types';

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);
    
    // Only allow POST
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, request, 405);
    }

    // Require authentication
    if (!await isAuthorized(request, env)) {
        return jsonResponse({ error: 'Unauthorized' }, request, 401);
    }

    try {
        const formData = await request.formData();
        const file = formData.get('image') as File | null;
        const folder = (formData.get('folder') as string) || 'uploads';

        if (!file) {
            return jsonResponse({ error: 'No image provided' }, request, 400);
        }

        // Validate the file is an image
        if (!file.type.startsWith('image/')) {
            return jsonResponse({ error: 'File must be an image' }, request, 400);
        }

        // Generate a unique filename: folder/timestamp-random.ext
        const ext = file.name.split('.').pop() || 'webp';
        const uniqueId = Math.random().toString(36).substring(2, 9);
        const objectKey = `${folder.replace(/^\/+|\/+$/g, '')}/${Date.now()}-${uniqueId}.${ext}`;

        // Ensure R2 bucket is bound
        if (!env.IMAGE_BUCKET) {
             console.error("R2 IMAGE_BUCKET binding missing");
             return jsonResponse({ error: 'Storage not configured properly' }, request, 500);
        }

        // Prepare ImgBB upload
        const imgbbFormData = new FormData();
        // file.stream() consumes the file, so we need to clone it or pass it safely.
        // Wait, FormData allows passing File objects directly in Workers if we construct a new Request or use native fetch.
        // Actually, we can just pass the `file` directly to FormData for fetch.
        imgbbFormData.append('image', file);

        const uploadToR2 = env.IMAGE_BUCKET.put(objectKey, file.stream(), {
            httpMetadata: {
                contentType: file.type,
                cacheControl: 'public, max-age=31536000', // 1 year
            }
        });

        const uploadToImgBB = fetch(`https://api.imgbb.com/1/upload?key=${env.VITE_IMGBB_API_KEY}`, {
            method: 'POST',
            body: imgbbFormData,
        }).then(res => res.json()).catch(err => null);

        // Run both uploads concurrently
        const [r2Result, imgbbResult] = await Promise.all([uploadToR2, uploadToImgBB]);

        // The URL format depends on how we serve it. We'll use our own /api/r2/image/ endpoint.
        const url = new URL(request.url);
        const imageUrl = `${url.origin}/api/r2/image/${objectKey}`;
        let fallbackUrl = '';
        if (imgbbResult && imgbbResult.success && imgbbResult.data?.url) {
             fallbackUrl = imgbbResult.data.url;
        }

        return jsonResponse({
            success: true,
            data: {
                url: imageUrl,
                fallback_url: fallbackUrl,
                key: objectKey
            }
        }, request, 200);

    } catch (error) {
        console.error('R2 upload error:', error);
        return jsonResponse({ error: 'Upload failed' }, request, 500);
    }
};
