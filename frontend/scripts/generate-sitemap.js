import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://orbitsaas.cloud';
const API_URL = 'https://orbitsaas.cloud/api/content?lang=en';

function cleanSlug(raw, fallbackTitle) {
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
    return encodeURIComponent(raw || 'item');
}

function escapeXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Robust helper to extract a clean string URL from an image input
 * Supports plain string, Gen 1 '|||' delimited string, stringified JSON,
 * Gen 2 object { primary, fallback }, or object with url / src.
 */
function getImageUrl(raw) {
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

function toAbsoluteUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${SITE_URL}${url}`;
    return `${SITE_URL}/${url}`;
}

function getValidImages(item) {
    if (!item || typeof item !== 'object') return [];
    const rawList = [];

    if (Array.isArray(item.images)) rawList.push(...item.images);
    if (item.image) rawList.unshift(item.image);
    if (item.coverImage) rawList.unshift(item.coverImage);
    if (item.badge) rawList.push(item.badge);

    const validUrls = [];
    for (const raw of rawList) {
        const extracted = getImageUrl(raw);
        if (extracted && (extracted.startsWith('http://') || extracted.startsWith('https://') || extracted.startsWith('/'))) {
            const abs = toAbsoluteUrl(extracted);
            if (!validUrls.includes(abs)) {
                validUrls.push(abs);
            }
        }
    }
    return validUrls;
}

async function generateSitemaps() {
    console.log('[generate-sitemap] Fetching latest content...');
    let projectItems = [];
    let achievementItems = [];
    let leadershipMembers = [];

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data.success && data.content) {
            projectItems = data.content.projects?.items || [];
            achievementItems = data.content.achievements?.items || [];
            leadershipMembers = data.content.leadership?.members || [];
        }
    } catch (error) {
        console.warn('[generate-sitemap] Live API fetch failed, trying local fallback:', error.message);
        try {
            const dumpPath = path.resolve(__dirname, '../../db-dump.json');
            if (fs.existsSync(dumpPath)) {
                const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
                if (Array.isArray(dump)) {
                    const pRow = dump.find(r => r.section === 'projects' && r.lang === 'en');
                    const aRow = dump.find(r => r.section === 'achievements' && r.lang === 'en');
                    const lRow = dump.find(r => r.section === 'leadership' && r.lang === 'en');
                    if (pRow) projectItems = JSON.parse(pRow.data)?.items || [];
                    if (aRow) achievementItems = JSON.parse(aRow.data)?.items || [];
                    if (lRow) leadershipMembers = JSON.parse(lRow.data)?.members || [];
                } else if (dump && typeof dump === 'object') {
                    projectItems = dump.projects?.items || [];
                    achievementItems = dump.achievements?.items || [];
                    leadershipMembers = dump.leadership?.members || [];
                }
            }
        } catch { /* skip */ }
    }

    const today = new Date().toISOString().split('T')[0];

    // ── 1. Main sitemap.xml ──
    const staticRoutes = [
        { path: '/', priority: '1.0', changefreq: 'daily' },
        { path: '/?lang=bn', priority: '0.8', changefreq: 'daily' },
        { path: '/privacy', priority: '0.4', changefreq: 'monthly' },
        { path: '/terms', priority: '0.4', changefreq: 'monthly' }
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

    for (const route of staticRoutes) {
        sitemap += `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    }

    // Projects in Main Sitemap
    for (const proj of projectItems) {
        if (proj.hidden) continue;
        const slug = cleanSlug(proj.id, proj.title);
        sitemap += `
  <url>
    <loc>${SITE_URL}/project/${slug}</loc>
    <lastmod>${proj.updated_at || proj.date || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

        const validImgs = getValidImages(proj);
        for (const imgUrl of validImgs.slice(0, 5)) {
            sitemap += `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(proj.title || 'Project Showcase')}</image:title>
    </image:image>`;
        }

        sitemap += `
  </url>`;
    }

    // Achievements in Main Sitemap
    for (const ach of achievementItems) {
        if (ach.hidden) continue;
        const slug = cleanSlug(ach.id, ach.title);
        sitemap += `
  <url>
    <loc>${SITE_URL}/achievement/${slug}</loc>
    <lastmod>${ach.updated_at || ach.date || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>`;

        const validImgs = getValidImages(ach);
        for (const imgUrl of validImgs.slice(0, 5)) {
            sitemap += `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(ach.title || 'Achievement')}</image:title>
    </image:image>`;
        }

        sitemap += `
  </url>`;
    }

    // Leadership Team in Main Sitemap
    for (const member of leadershipMembers) {
        if (member.hidden) continue;
        const slug = cleanSlug(member.id, member.name);
        const validImgs = getValidImages(member);
        sitemap += `
  <url>
    <loc>${SITE_URL}/?member=${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>`;

        for (const imgUrl of validImgs.slice(0, 3)) {
            sitemap += `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(member.name || 'Leadership Team')}${member.role ? ' - ' + escapeXml(member.role) : ''}</image:title>
    </image:image>`;
        }

        sitemap += `
  </url>`;
    }

    sitemap += `
</urlset>`;

    const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap);
    console.log(`[generate-sitemap] Main sitemap generated at ${sitemapPath}`);

    const distSitemapPath = path.join(__dirname, '../dist/sitemap.xml');
    if (fs.existsSync(path.dirname(distSitemapPath))) {
        fs.writeFileSync(distSitemapPath, sitemap);
    }

    // ── 2. Dedicated sitemap-images.xml ──
    let imgSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/</loc>
    <image:image>
      <image:loc>${SITE_URL}/og-banner-v2.png</image:loc>
      <image:title>ORBIT SaaS Banner</image:title>
    </image:image>
    <image:image>
      <image:loc>${SITE_URL}/favicon.png</image:loc>
      <image:title>ORBIT SaaS Logo</image:title>
    </image:image>
  </url>`;

    // Projects in Image Sitemap
    for (const proj of projectItems) {
        if (proj.hidden) continue;
        const slug = cleanSlug(proj.id, proj.title);
        const validImgs = getValidImages(proj);
        if (validImgs.length === 0) continue;

        imgSitemap += `
  <url>
    <loc>${SITE_URL}/project/${slug}</loc>`;
        for (const imgUrl of validImgs) {
            imgSitemap += `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(proj.title || 'Project Showcase')}</image:title>
    </image:image>`;
        }
        imgSitemap += `
  </url>`;
    }

    // Achievements in Image Sitemap
    for (const ach of achievementItems) {
        if (ach.hidden) continue;
        const slug = cleanSlug(ach.id, ach.title);
        const validImgs = getValidImages(ach);
        if (validImgs.length === 0) continue;

        imgSitemap += `
  <url>
    <loc>${SITE_URL}/achievement/${slug}</loc>`;
        for (const imgUrl of validImgs) {
            imgSitemap += `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(ach.title || 'Achievement')}</image:title>
    </image:image>`;
        }
        imgSitemap += `
  </url>`;
    }

    // Leadership in Image Sitemap
    for (const member of leadershipMembers) {
        if (member.hidden) continue;
        const slug = cleanSlug(member.id, member.name);
        const validImgs = getValidImages(member);
        if (validImgs.length === 0) continue;

        imgSitemap += `
  <url>
    <loc>${SITE_URL}/?member=${slug}</loc>`;
        for (const imgUrl of validImgs) {
            imgSitemap += `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(member.name || 'Leadership Team')}${member.role ? ' - ' + escapeXml(member.role) : ''}</image:title>
    </image:image>`;
        }
        imgSitemap += `
  </url>`;
    }

    imgSitemap += `
</urlset>`;

    const imgSitemapPath = path.join(__dirname, '../public/sitemap-images.xml');
    fs.writeFileSync(imgSitemapPath, imgSitemap);
    console.log(`[generate-sitemap] Image sitemap generated at ${imgSitemapPath}`);

    const distImgSitemapPath = path.join(__dirname, '../dist/sitemap-images.xml');
    if (fs.existsSync(path.dirname(distImgSitemapPath))) {
        fs.writeFileSync(distImgSitemapPath, imgSitemap);
    }
}

generateSitemaps();
