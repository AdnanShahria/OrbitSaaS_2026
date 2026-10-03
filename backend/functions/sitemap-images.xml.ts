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

export const onRequest: PagesFunction<Env> = async (context) => {
    const { env } = context;
    const db = getDb(env);

    try {
        const baseUrl = 'https://orbitsaas.cloud';

        // 1. Fetch Projects & Achievements
        let projects: any[] = [];
        let achievements: any[] = [];

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
            const imgs: string[] = [];

            if (Array.isArray(proj.images)) imgs.push(...proj.images);
            if (proj.image && !imgs.includes(proj.image)) imgs.unshift(proj.image);
            if (proj.coverImage && !imgs.includes(proj.coverImage)) imgs.unshift(proj.coverImage);

            const validImgs = imgs.filter(u => typeof u === 'string' && u.startsWith('http'));
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
            const imgs: string[] = Array.isArray(ach.images) ? ach.images : [];
            const validImgs = imgs.filter(u => typeof u === 'string' && u.startsWith('http'));
            if (validImgs.length === 0) continue;

            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/achievement/${slug}</loc>\n`;
            for (const imgUrl of validImgs) {
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
                if (ach.title) {
                    xml += `      <image:title>${escapeXml(ach.title)}</image:title>\n`;
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
                'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
                'X-Robots-Tag': 'all',
                'X-Content-Type-Options': 'nosniff'
            }
        });
    } catch (error) {
        console.error('Image Sitemap error:', error);
        return new Response('Error generating image sitemap', { status: 500 });
    }
};
