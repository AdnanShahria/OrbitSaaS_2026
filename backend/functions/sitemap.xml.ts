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
        // If it's not purely a numeric index like "9", use it
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
    return encodeURIComponent(raw || 'item');
}

function formatIsoDate(val: unknown, fallback: string): string {
    if (!val) return fallback;
    try {
        const s = String(val).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            return s.substring(0, 10);
        }
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
    } catch {
        /* skip */
    }
    return fallback;
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
        const today = new Date().toISOString().split('T')[0];

        // 1. Fetch latest update timestamp across the entire site
        let latestSiteMod = today;
        try {
            const maxRes = await db.execute({
                sql: "SELECT MAX(updated_at) as last_updated FROM site_content"
            });
            if (maxRes.rows.length > 0 && maxRes.rows[0].last_updated) {
                latestSiteMod = formatIsoDate(maxRes.rows[0].last_updated, today);
            }
        } catch {
            /* fallback to today */
        }

        // 2. Fetch Projects
        let projects: any[] = [];
        let projectsSectionMod = latestSiteMod;
        try {
            const pResult = await db.execute({
                sql: "SELECT data, updated_at FROM site_content WHERE section = 'projects' AND lang = 'en'"
            });
            if (pResult.rows.length > 0) {
                const row = pResult.rows[0];
                if (row.updated_at) projectsSectionMod = formatIsoDate(row.updated_at, latestSiteMod);
                const parsed = JSON.parse(row.data as string);
                projects = Array.isArray(parsed?.items) ? parsed.items : [];
            }
        } catch (e) {
            console.error('Sitemap: Failed to load projects', e);
        }

        // 3. Fetch Achievements
        let achievements: any[] = [];
        let achievementsSectionMod = latestSiteMod;
        try {
            const aResult = await db.execute({
                sql: "SELECT data, updated_at FROM site_content WHERE section = 'achievements' AND lang = 'en'"
            });
            if (aResult.rows.length > 0) {
                const row = aResult.rows[0];
                if (row.updated_at) achievementsSectionMod = formatIsoDate(row.updated_at, latestSiteMod);
                const parsed = JSON.parse(row.data as string);
                achievements = Array.isArray(parsed?.items) ? parsed.items : [];
            }
        } catch (e) {
            console.error('Sitemap: Failed to load achievements', e);
        }

        // 4. Fetch Leadership
        let leadership: any[] = [];
        let leadershipSectionMod = latestSiteMod;
        try {
            const lResult = await db.execute({
                sql: "SELECT data, updated_at FROM site_content WHERE section = 'leadership' AND lang = 'en'"
            });
            if (lResult.rows.length > 0) {
                const row = lResult.rows[0];
                if (row.updated_at) leadershipSectionMod = formatIsoDate(row.updated_at, latestSiteMod);
                const parsed = JSON.parse(row.data as string);
                leadership = Array.isArray(parsed?.members) ? parsed.members : [];
            }
        } catch (e) {
            console.error('Sitemap: Failed to load leadership', e);
        }

        const baseUrl = 'https://orbitsaas.cloud';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
        xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n`;
        xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

        // ── Core Indexable Canonical Routes (NO # fragments) ──
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/</loc>\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/" />\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="bn" href="${baseUrl}/?lang=bn" />\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />\n`;
        xml += `    <lastmod>${latestSiteMod}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>1.0</priority>\n`;
        xml += `  </url>\n`;

        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/?lang=bn</loc>\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="bn" href="${baseUrl}/?lang=bn" />\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/" />\n`;
        xml += `    <lastmod>${latestSiteMod}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;

        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/privacy</loc>\n`;
        xml += `    <lastmod>${latestSiteMod}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.4</priority>\n`;
        xml += `  </url>\n`;

        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/terms</loc>\n`;
        xml += `    <lastmod>${latestSiteMod}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.4</priority>\n`;
        xml += `  </url>\n`;

        // ── Dynamic Project Pages (with Google Image Extension) ──
        for (let i = 0; i < projects.length; i++) {
            const proj = projects[i];
            if (proj.hidden === true) continue;

            const slug = cleanSlug(proj.id, proj.title);
            const itemDate = formatIsoDate(proj.updated_at || proj.date, projectsSectionMod);

            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/project/${slug}</loc>\n`;
            xml += `    <lastmod>${itemDate}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;

            const validImgs = getValidImages(proj, baseUrl);
            for (const imgUrl of validImgs.slice(0, 5)) {
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
                if (proj.title) {
                    xml += `      <image:title>${escapeXml(proj.title)}</image:title>\n`;
                }
                xml += `    </image:image>\n`;
            }

            xml += `  </url>\n`;
        }

        // ── Dynamic Achievement Pages ──
        for (let i = 0; i < achievements.length; i++) {
            const ach = achievements[i];
            if (ach.hidden === true) continue;

            const slug = cleanSlug(ach.id, ach.title);
            const itemDate = formatIsoDate(ach.updated_at || ach.date, achievementsSectionMod);

            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/achievement/${slug}</loc>\n`;
            xml += `    <lastmod>${itemDate}</lastmod>\n`;
            xml += `    <changefreq>monthly</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;

            const validImgs = getValidImages(ach, baseUrl);
            for (const imgUrl of validImgs.slice(0, 5)) {
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
                if (ach.title) {
                    xml += `      <image:title>${escapeXml(ach.title)}</image:title>\n`;
                }
                xml += `    </image:image>\n`;
            }

            xml += `  </url>\n`;
        }

        // ── Dynamic Leadership Members ──
        for (let i = 0; i < leadership.length; i++) {
            const member = leadership[i];
            if (member.hidden === true) continue;

            const slug = cleanSlug(member.id, member.name);
            const itemDate = formatIsoDate(member.updated_at, leadershipSectionMod);

            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/?member=${slug}</loc>\n`;
            xml += `    <lastmod>${itemDate}</lastmod>\n`;
            xml += `    <changefreq>monthly</changefreq>\n`;
            xml += `    <priority>0.6</priority>\n`;

            const validImgs = getValidImages(member, baseUrl);
            for (const imgUrl of validImgs.slice(0, 3)) {
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
                xml += `      <image:title>${escapeXml(member.name || 'Leadership Team')}${member.role ? ' - ' + escapeXml(member.role) : ''}</image:title>\n`;
                xml += `    </image:image>\n`;
            }

            xml += `  </url>\n`;
        }

        xml += `</urlset>`;

        return new Response(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Last-Modified': new Date(latestSiteMod).toUTCString(),
                // Fresh edge caching: 30m CDN cache, stale-while-revalidate for instant crawls
                'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
                'X-Robots-Tag': 'all, index, follow',
                'X-Content-Type-Options': 'nosniff'
            }
        });
    } catch (error) {
        console.error('Sitemap generation error:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
};
