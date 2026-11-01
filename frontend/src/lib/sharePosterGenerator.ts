/**
 * sharePosterGenerator.ts
 * 
 * Automatically generates 1200x630 branded social share posters (OG images)
 * with the signature ORBIT SaaS curved bottom-right branding wave.
 * 
 * Used during image upload / update for:
 * - Projects (cover photo with stylish bottom-right OrbitSaaS wave)
 * - Achievements (achievement thumbnail with stylish bottom-right OrbitSaaS wave)
 * - Leadership (executive profile card with portrait, name, role, and bottom-right OrbitSaaS wave)
 * 
 * These posters are stored internally and ONLY served to social media links
 * (WhatsApp, Facebook, Twitter/X, LinkedIn, Discord) via Open Graph meta tags,
 * leaving the website display clean and untouched.
 * 
 * Generated strictly as JPEG (image/jpeg, 1200x630, <250KB) to enforce WhatsApp's
 * rich 2-row stacked card layout (Row 1: big banner; Row 2: title/info).
 */

import { getImageUrl } from './imageUrl';

export interface PosterOptions {
    type: 'project' | 'achievement' | 'leadership';
    title?: string;
    name?: string;
    role?: string;
    subDetail?: string;
}

/**
 * Loads an image from a URL or File into an HTMLImageElement with crossOrigin support.
 */
function loadImage(source: string | File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        if (source instanceof File || source instanceof Blob) {
            const objectUrl = URL.createObjectURL(source);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(img);
            };
            img.onerror = (e) => {
                URL.revokeObjectURL(objectUrl);
                reject(e);
            };
            img.src = objectUrl;
        } else {
            const cleanUrl = getImageUrl(source) || source;
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = cleanUrl;
        }
    });
}

/**
 * Draws the signature bottom-right OrbitSaaS curved tech wave.
 */
function drawBrandWave(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    logoImg: HTMLImageElement | null
) {
    ctx.save();

    // 1. Layer 1: Ambient soft outer wave sweep
    const ambGrad = ctx.createLinearGradient(710, 355, 1200, 630);
    ambGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
    ambGrad.addColorStop(1, 'rgba(7, 89, 133, 0.28)');
    ctx.fillStyle = ambGrad;
    ctx.beginPath();
    ctx.moveTo(710, 630);
    ctx.bezierCurveTo(820, 540, 930, 430, 1200, 355);
    ctx.lineTo(1200, 630);
    ctx.closePath();
    ctx.fill();

    // 2. Layer 2: Mid glowing cyan ripple
    const midGrad = ctx.createLinearGradient(760, 395, 1200, 630);
    midGrad.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
    midGrad.addColorStop(0.5, 'rgba(2, 132, 199, 0.40)');
    midGrad.addColorStop(1, 'rgba(3, 105, 161, 0.60)');
    ctx.fillStyle = midGrad;
    ctx.beginPath();
    ctx.moveTo(760, 630);
    ctx.bezierCurveTo(855, 530, 955, 430, 1200, 395);
    ctx.lineTo(1200, 630);
    ctx.closePath();
    ctx.fill();

    // Mid cyan accent stroke line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(760, 630);
    ctx.bezierCurveTo(855, 530, 955, 430, 1200, 395);
    ctx.stroke();

    // 3. Layer 3: Subtle secondary accent line
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(810, 630);
    ctx.bezierCurveTo(895, 550, 985, 470, 1200, 440);
    ctx.stroke();

    // 4. Layer 4: Solid Main Deep Ocean Corner Wave with deep shadow
    ctx.shadowColor = 'rgba(0, 10, 25, 0.75)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = -10;
    ctx.shadowOffsetY = -8;

    const mainGrad = ctx.createLinearGradient(835, 455, 1200, 630);
    mainGrad.addColorStop(0, '#041836');
    mainGrad.addColorStop(0.45, '#020f22');
    mainGrad.addColorStop(1, '#010610');
    ctx.fillStyle = mainGrad;

    ctx.beginPath();
    ctx.moveTo(835, 630);
    ctx.bezierCurveTo(910, 575, 975, 490, 1200, 455);
    ctx.lineTo(1200, 630);
    ctx.closePath();
    ctx.fill();

    // Corner wave edge border
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(835, 630);
    ctx.bezierCurveTo(910, 575, 975, 490, 1200, 455);
    ctx.stroke();

    // 5. Draw Orbit Logo Icon & Typography
    const logoSize = 54;
    const logoX = 920;
    const logoY = 525;

    if (logoImg) {
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    }

    ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '-0.5px';
    ctx.fillText('OrbitSaaS', 984, 563);

    ctx.restore();
}

/**
 * Generates a 1200x630 share poster as a high-quality JPEG File (<250KB).
 */
export async function generateSharePoster(
    source: string | File | Blob,
    options: PosterOptions
): Promise<File> {
    const width = 1200;
    const height = 630;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    // 1. Load source image and logo icon
    const [mainImg, logoImg] = await Promise.all([
        loadImage(source),
        loadImage('/orbit-icon.png')
            .catch(() => loadImage('/orbit-watermark.png'))
            .catch(() => null)
    ]);

    // 2. Draw canvas depending on type
    if (options.type === 'leadership') {
        // --- LEADERSHIP EXECUTIVE CARD ---
        // Dark background with gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0a0f1d');
        bgGrad.addColorStop(0.5, '#060913');
        bgGrad.addColorStop(1, '#03050a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Tech grid lines pattern
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += 60) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Ambient radial glow behind portrait
        const glow = ctx.createRadialGradient(280, 315, 50, 280, 315, 320);
        glow.addColorStop(0, 'rgba(0, 229, 255, 0.18)');
        glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 600, height);

        // Draw portrait with rounded corners and cyan border
        const pSize = 400;
        const pX = 80;
        const pY = (height - pSize) / 2;
        const radius = 24;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pX + radius, pY);
        ctx.lineTo(pX + pSize - radius, pY);
        ctx.quadraticCurveTo(pX + pSize, pY, pX + pSize, pY + radius);
        ctx.lineTo(pX + pSize, pY + pSize - radius);
        ctx.quadraticCurveTo(pX + pSize, pY + pSize, pX + pSize - radius, pY + pSize);
        ctx.lineTo(pX + radius, pY + pSize);
        ctx.quadraticCurveTo(pX, pY + pSize, pX, pY + pSize - radius);
        ctx.lineTo(pX, pY + radius);
        ctx.quadraticCurveTo(pX, pY, pX + radius, pY);
        ctx.closePath();
        ctx.clip();

        // Calculate aspect ratio cover for portrait
        const scale = Math.max(pSize / mainImg.width, pSize / mainImg.height);
        const sw = mainImg.width * scale;
        const sh = mainImg.height * scale;
        const sx = pX + (pSize - sw) / 2;
        const sy = pY + (pSize - sh) / 2;
        ctx.drawImage(mainImg, sx, sy, sw, sh);
        ctx.restore();

        // Portrait frame border
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pX + radius, pY);
        ctx.lineTo(pX + pSize - radius, pY);
        ctx.quadraticCurveTo(pX + pSize, pY, pX + pSize, pY + radius);
        ctx.lineTo(pX + pSize, pY + pSize - radius);
        ctx.quadraticCurveTo(pX + pSize, pY + pSize, pX + pSize - radius, pY + pSize);
        ctx.lineTo(pX + radius, pY + pSize);
        ctx.quadraticCurveTo(pX, pY + pSize, pX, pY + pSize - radius);
        ctx.lineTo(pX, pY + radius);
        ctx.quadraticCurveTo(pX, pY, pX + radius, pY);
        ctx.closePath();
        ctx.stroke();

        // Member Details on Right Side
        const textX = 530;
        
        // Badge
        ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(textX, 170, 240, 36, 18);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#00e5ff';
        ctx.letterSpacing = '1.5px';
        ctx.fillText('LEADERSHIP TEAM', textX + 22, 193);

        // Name
        ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(options.name || 'Team Leader', textX, 260);

        // Role
        ctx.font = '600 24px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(options.role || 'ORBIT SaaS', textX, 305);

        // Subdetail / Company
        ctx.font = '16px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('ORBIT SaaS — Custom Web Development & AI Solutions', textX, 355);

        // Verified Team Pill
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(textX, 400, 340, 48, 12);
        ctx.fill();
        ctx.stroke();

        ctx.font = '14px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('✨ Official Member Profile • orbitsaas.cloud', textX + 20, 430);

    } else {
        // --- PROJECT OR ACHIEVEMENT POSTER ---
        // Fill canvas with background
        ctx.fillStyle = '#080c14';
        ctx.fillRect(0, 0, width, height);

        // Draw image covering the entire 1200x630
        const scale = Math.max(width / mainImg.width, height / mainImg.height);
        const sw = mainImg.width * scale;
        const sh = mainImg.height * scale;
        const sx = (width - sw) / 2;
        const sy = (height - sh) / 2;
        ctx.drawImage(mainImg, sx, sy, sw, sh);

        // Bottom subtle gradient bar for contrast
        const bottomGrad = ctx.createLinearGradient(0, height - 160, 0, height);
        bottomGrad.addColorStop(0, 'rgba(6, 9, 16, 0)');
        bottomGrad.addColorStop(1, 'rgba(6, 9, 16, 0.85)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, height - 160, width, 160);

        if (options.title) {
            ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 8;
            const displayTitle = options.title.length > 55 ? options.title.substring(0, 52) + '...' : options.title;
            ctx.fillText(displayTitle, 40, height - 40);
            ctx.shadowBlur = 0;
        }
    }

    // 3. Draw Signature Bottom-Right Brand Wave
    drawBrandWave(ctx, width, height, logoImg);

    // 4. Export strictly as JPEG File (<250KB) for guaranteed WhatsApp 2-Row Large Card
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas toBlob returned null'));
                    return;
                }
                const filename = `share-${options.type}-${Date.now()}.jpg`;
                const file = new File([blob], filename, { type: 'image/jpeg' });
                resolve(file);
            },
            'image/jpeg',
            0.88
        );
    });
}
