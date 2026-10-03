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

async function generateSitemaps() {
    console.log('[generate-sitemap] Fetching latest content...');
    let projectItems = [];
    let achievementItems = [];

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data.success && data.content) {
            projectItems = data.content.projects?.items || [];
            achievementItems = data.content.achievements?.items || [];
        }
    } catch (error) {
        console.warn('[generate-sitemap] Live API fetch failed, trying local fallback:', error.message);
        try {
            const dumpPath = path.resolve(__dirname, '../../db-dump.json');
            if (fs.existsSync(dumpPath)) {
                const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
                projectItems = dump.projects?.items || [];
                achievementItems = dump.achievements?.items || [];
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

    for (const proj of projectItems) {
        if (proj.hidden) continue;
        const slug = cleanSlug(proj.id, proj.title);
        sitemap += `
  <url>
    <loc>${SITE_URL}/project/${slug}</loc>
    <lastmod>${proj.updated_at || proj.date || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

        const imgs = [];
        if (Array.isArray(proj.images)) imgs.push(...proj.images);
        if (proj.image && !imgs.includes(proj.image)) imgs.unshift(proj.image);
        if (proj.coverImage && !imgs.includes(proj.coverImage)) imgs.unshift(proj.coverImage);

        for (const imgUrl of imgs.slice(0, 5)) {
            if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                sitemap += `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(proj.title || 'Project Showcase')}</image:title>
    </image:image>`;
            }
        }

        sitemap += `
  </url>`;
    }

    for (const ach of achievementItems) {
        if (ach.hidden) continue;
        const slug = cleanSlug(ach.id, ach.title);
        sitemap += `
  <url>
    <loc>${SITE_URL}/achievement/${slug}</loc>
    <lastmod>${ach.updated_at || ach.date || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    sitemap += `
</urlset>`;

    const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap);
    console.log(`[generate-sitemap] Main sitemap generated at ${sitemapPath}`);

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

    for (const proj of projectItems) {
        if (proj.hidden) continue;
        const slug = cleanSlug(proj.id, proj.title);
        const imgs = [];
        if (Array.isArray(proj.images)) imgs.push(...proj.images);
        if (proj.image && !imgs.includes(proj.image)) imgs.unshift(proj.image);
        if (proj.coverImage && !imgs.includes(proj.coverImage)) imgs.unshift(proj.coverImage);

        const validImgs = imgs.filter(u => typeof u === 'string' && u.startsWith('http'));
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

    imgSitemap += `
</urlset>`;

    const imgSitemapPath = path.join(__dirname, '../public/sitemap-images.xml');
    fs.writeFileSync(imgSitemapPath, imgSitemap);
    console.log(`[generate-sitemap] Image sitemap generated at ${imgSitemapPath}`);
}

generateSitemaps();
