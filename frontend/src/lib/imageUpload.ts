import imageCompression from 'browser-image-compression';
import { buildImageUrl, type ImageUrl } from './imageUrl';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

/**
 * Uploads an image to Cloudflare R2 as the primary source,
 * falling back to ImgBB if R2 fails or isn't configured.
 * 
 * @param file The image file to upload
 * @param folder Optional virtual folder in R2 (e.g., 'projects/lifesolver')
 */
export async function uploadImage(
    file: File, 
    folder: string = 'uploads',
    skipCompression: boolean = false
): Promise<ImageUrl> {
    // 1. Compress the file before uploading (unless skipped)
    let fileToUpload = file;
    if (!skipCompression && file.type.startsWith('image/')) {
        const options = {
            maxSizeMB: 0.15, // 150KB target
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/webp' // Convert everything to webp for maximum compression
        };
        
        try {
            const compressedBlob = await imageCompression(file, options);
            console.log(`[Image Optimizer] Compressed "${file.name}": ${(file.size / 1024 / 1024).toFixed(2)} MB -> ${(compressedBlob.size / 1024).toFixed(2)} KB`);
            fileToUpload = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: 'image/webp',
            });
        } catch (error) {
            console.error('Image compression failed, uploading original:', error);
        }
    }

    // 2. Upload to Cloudflare R2 Backend (which also handles ImgBB sync)
    try {
        const r2FormData = new FormData();
        r2FormData.append('image', fileToUpload);
        r2FormData.append('folder', folder);

        const token = localStorage.getItem('admin_token');
        const API_BASE = import.meta.env.VITE_API_URL || '';
        
        const r2Res = await fetch(`${API_BASE}/api/r2/upload`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: r2FormData,
        });

        if (r2Res.ok) {
            const data = await r2Res.json();
            if (data.success && data.data?.url) {
                console.log('[Image Upload] Successfully uploaded to Cloudflare R2:', data.data.url);
                // Return a structured ImageUrl object with primary + optional fallback
                return buildImageUrl(data.data.url, data.data.fallback_url || null);
            }
        } else {
             console.warn(`[Image Upload] R2 upload failed with status ${r2Res.status}. Falling back to ImgBB.`);
        }
    } catch (error) {
        console.error('[Image Upload] R2 upload threw an error, falling back to ImgBB:', error);
    }

    // 3. Client-side Fallback to ImgBB Upload (if backend is entirely down)
    console.log('[Image Upload] Attempting ImgBB fallback upload...');
    const formData = new FormData();
    formData.append('image', fileToUpload);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) throw new Error('ImgBB upload failed');
    const data = await res.json();
    // ImgBB-only fallback — no R2 primary, just return a simple string-based ImageUrl
    return buildImageUrl(data.data.url);
}
