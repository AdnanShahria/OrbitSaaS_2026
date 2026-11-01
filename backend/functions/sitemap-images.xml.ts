import { getDb } from './_lib/db';
import type { Env } from './_lib/types';

function escapeXml(str: string): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function cleanSlug(raw: string, fallbackTitle?: string): string {
    if (raw && typeof raw === 'string' && raw.trim()) {
        const trimmed = raw.trim();
        if (!/^\d+$/.test(trimmed)) {
            return encodeURIComponent(trimmed);
        }
    }
    if (fallbackTitle && typeof fallbackTitle === 'string') {
        const slug = fallbackTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        if (slug) return encodeURIComponent(slug);
    }
    return encodeURIComponent(raw || 'project');
}

/**
 * Robust helper to extract a clean string URL from an image input
 * Supports plain string, Gen 1 '|||' delimited string, stringified JSON,
 * Gen 2 object { primary, fallback }, or object with url / src.
 */
function getImageUrl(raw: any): string {
    if (!raw) return '';
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return getImageUrl(parsed);
            } catch { /* fallback to string */ }
        }
        return trimmed.split('|||')[0].trim();
    }
    if (typeof raw === 'object' && raw !== null) {
        if (typeof raw.primary === 'string') return raw.primary.trim();
        if (typeof raw.url === 'string') return raw.url.trim();
        if (typeof raw.src === 'string') return raw.src.trim();
        if (typeof raw.fallback === 'string') return raw.fallback.trim();
        if (raw.primary && typeof raw.primary === 'object') return getImageUrl(raw.primary);
        if (raw.url && typeof raw.url === 'object') return getImageUrl(raw.url);
    }
    return '';
}

function toAbsoluteUrl(url: string, baseUrl: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    return `${baseUrl}/${url}`;
}

function getValidImages(item: any, baseUrl: string): string[] {
    if (!item || typeof item !== 'object') return [];
    const rawList: any[] = [];

    if (Array.isArray(item.images)) rawList.push(...item.images);
    if (item.image) rawList.unshift(item.image);
    if (item.coverImage) rawList.unshift(item.coverImage);
    if (item.badge) rawList.push(item.badge);

    const validUrls: string[] = [];
    for (const raw of rawList) {
        const extracted = getImageUrl(raw);
        if (extracted && (extracted.startsWith('http://') || extracted.startsWith('https://') || extracted.startsWith('/'))) {
            const abs = toAbsoluteUrl(extracted, baseUrl);
            if (!validUrls.includes(abs)) {
                validUrls.push(abs);
            }
        }
    }
    return validUrls;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { env } = context;
    const db = getDb(env);

    try {
        const baseUrl = 'https://orbitsaas.cloud';

        // 1. Fetch Projects, Achievements & Leadership
        let projects: any[] = [];
        let achievements: any[] = [];
        let leadership: any[] = [];

        try {
            const pResult = await db.execute({
                sql: "SELECT data FROM site_content WHERE section = 'projects' AND lang = 'en'"
            });
            if (pResult.rows.length > 0) {
                const parsed = JSON.parse(pResult.rows[0].data as string);
                projects = Array.isArray(parsed?.items) ? parsed.items : [];
            }
        } catch (e) {
            console.error('Image Sitemap: Failed to load projects', e);
        }

        try {
            const aResult = await db.execute({
                sql: "SELECT data FROM site_content WHERE section = 'achievements' AND lang = 'en'"
            });
            if (aResult.rows.length > 0) {
                const parsed = JSON.parse(aResult.rows[0].data as string);
                achievements = Array.isArray(parsed?.items) ? parsed.items : [];
            }
        } catch (e) {
            console.error('Image Sitemap: Failed to load achievements', e);
        }

        try {
            const lResult = await db.execute({
                sql: "SELECT data FROM site_content WHERE section = 'leadership' AND lang = 'en'"
            });
            if (lResult.rows.length > 0) {
                const parsed = JSON.parse(lResult.rows[0].data as string);
                leadership = Array.isArray(parsed?.members) ? parsed.members : [];
            }
        } catch (e) {
            console.error('Image Sitemap: Failed to load leadership', e);
        }

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
        xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

        // ── 1. Homepage Brand Assets ──
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/</loc>\n`;
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${baseUrl}/og-banner-v2.png</image:loc>\n`;
        xml += `      <image:title>ORBIT SaaS - Custom Web Development, AI Chatbots &amp; SaaS Agency</image:title>\n`;
        xml += `      <image:caption>ORBIT SaaS official branding banner</image:caption>\n`;
        xml += `    </image:image>\n`;
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${baseUrl}/favicon.png</image:loc>\n`;
        xml += `      <image:title>ORBIT SaaS Emblem Logo</image:title>\n`;
        xml += `    </image:image>\n`;
        xml += `  </url>\n`;

        // ── 2. Project Images ──
        for (const proj of projects) {
            if (proj.hidden === true) continue;
            const slug = cleanSlug(proj.id, proj.title);
            const validImgs = getValidImages(proj, baseUrl);
            if (validImgs.length === 0) continue;

            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/project/${slug}</loc>\n`;
            for (const imgUrl of validImgs) {
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
                if (proj.title) {
                    xml += `      <image:title>${escapeXml(proj.title)} Showcase</image:title>\n`;
                }
                if (proj.tagline || proj.desc) {
                    const caption = (proj.tagline || proj.desc || '').replace(/<[^>]*>/g, '').substring(0, 200);
                    xml += `      <image:caption>${escapeXml(caption)}</image:caption>\n`;
                }
                xml += `    </image:image>\n`;
            }
            xml += `  </url>\n`;
        }

        // ── 3. Achievement Images ──
        for (const ach of achievements) {
            if (ach.hidden === true) continue;
            const slug = cleanSlug(ach.id, ach.title);
            const validImgs = getValidImages(ach, baseUrl);
            if (validImgs.length === 0) continue;

            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/achievement/${slug}</loc>\n`;
            for (const imgUrl of validImgs) {
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
                if (ach.title) {
                    xml += `      <image:title>${escapeXml(ach.title)}</image:title>\n`;
                }
                if (ach.desc || ach.description) {
                    const caption = (ach.desc || ach.description || '').replace(/<[^>]*>/g, '').substring(0, 200);
                    xml += `      <image:caption>${escapeXml(caption)}</image:caption>\n`;
                }
                xml += `    </image:image>\n`;
            }
            xml += `  </url>\n`;
        }

        // ── 4. Leadership Team Images ──
        for (const member of leadership) {
            if (member.hidden === true) continue;
            const slug = cleanSlug(member.id, member.name);
            const validImgs = getValidImages(member, baseUrl);
            if (validImgs.length === 0) continue;

            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/?member=${slug}</loc>\n`;
            for (const imgUrl of validImgs) {
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
                xml += `      <image:title>${escapeXml(member.name || 'Leadership Team')}${member.role ? ' - ' + escapeXml(member.role) : ''}</image:title>\n`;
                if (member.bio) {
                    const caption = (member.bio || '').replace(/<[^>]*>/g, '').substring(0, 200);
                    xml += `      <image:caption>${escapeXml(caption)}</image:caption>\n`;
                }
                xml += `    </image:image>\n`;
            }
            xml += `  </url>\n`;
        }

        xml += `</urlset>`;

        return new Response(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Last-Modified': new Date().toUTCString(),
                'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
                'X-Robots-Tag': 'all, index, follow',
                'X-Content-Type-Options': 'nosniff'
            }
        });
    } catch (error) {
        console.error('Image Sitemap error:', error);
        return new Response('Error generating image sitemap', { status: 500 });
    }
};
