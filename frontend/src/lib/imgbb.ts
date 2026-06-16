import imageCompression from 'browser-image-compression';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export async function uploadToImgBB(file: File): Promise<string> {
    // Compress the file before uploading
    const options = {
        maxSizeMB: 0.5, // 500KB target
        maxWidthOrHeight: 1920, // Max 1080p equivalent
        useWebWorker: true,
        fileType: 'image/webp' // Convert everything to webp for maximum compression
    };
    
    let fileToUpload = file;
    try {
        if (file.type.startsWith('image/')) {
            const compressedBlob = await imageCompression(file, options);
            // Convert Blob back to File to maintain filename
            fileToUpload = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: 'image/webp',
            });
        }
    } catch (error) {
        console.error('Image compression failed, uploading original:', error);
    }

    const formData = new FormData();
    formData.append('image', fileToUpload);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) throw new Error('ImgBB upload failed');
    const data = await res.json();
    return data.data.url;
}
