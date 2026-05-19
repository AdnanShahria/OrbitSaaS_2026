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

        const staticRoutes = [
            '/',
            '/#services',
            '/#tech-stack',
            '/#why-us',
            '/#projects',
            '/#leadership',
            '/#contact',
            '/privacy',
            '/terms'
        ];

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add static routes
        staticRoutes.forEach(route => {
            sitemap += `
  <url>
    <loc>${SITE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
        });

        // Add dynamic project routes
        projectItems.forEach((_, index) => {
            sitemap += `
  <url>
    <loc>${SITE_URL}/project/${index}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
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
