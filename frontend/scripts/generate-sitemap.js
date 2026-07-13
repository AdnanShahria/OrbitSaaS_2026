import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://orbitsaas.cloud';
const API_URL = 'https://orbitsaas.cloud/api/content?lang=en';

async function generateSitemap() {
    console.log('Fetching content...');
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!data.success || !data.content) {
            throw new Error('Invalid data format');
        }

        const projectItems = data.content.projects?.items || [];
        console.log(`Found ${projectItems.length} projects.`);

        // Only real, indexable pages — no hash fragments (Google ignores fragments)
        const staticRoutes = [
            { path: '/', priority: '1.0' },
            { path: '/?lang=bn', priority: '0.8' },
            { path: '/privacy', priority: '0.4' },
            { path: '/terms', priority: '0.4' }
        ];

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        const today = new Date().toISOString().split('T')[0];

        // Add static routes
        staticRoutes.forEach(route => {
            sitemap += `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
        });

        // Add dynamic project routes using slug ID (not numeric index)
        projectItems.forEach((proj, index) => {
            if (proj.hidden) return; // Skip hidden projects
            const id = proj.id || String(index);
            sitemap += `
  <url>
    <loc>${SITE_URL}/project/${encodeURIComponent(id)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });

        sitemap += `
</urlset>`;

        const publicPath = path.join(__dirname, '../public/sitemap.xml');
        fs.writeFileSync(publicPath, sitemap);
        console.log(`Sitemap generated at ${publicPath}`);

    } catch (error) {
        console.error('Error generating sitemap:', error);
    }
}

generateSitemap();
