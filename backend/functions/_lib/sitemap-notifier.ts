import type { Env } from './types';

const SITE_URL = 'https://orbitsaas.cloud';
const INDEXNOW_KEY = 'orbit2026indexnowe78b945d8201fe';

/**
 * Triggers instant cache purge and search engine notifications
 * whenever an admin edits or publishes content on the website.
 */
export async function notifySitemapUpdate(env: Env, changedUrls: string[] = []) {
    const urlsToPing = Array.from(new Set([
        `${SITE_URL}/`,
        `${SITE_URL}/sitemap.xml`,
        `${SITE_URL}/sitemap-images.xml`,
        ...changedUrls.map(u => u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`)
    ]));

    let cachePurged = false;
    // 1. Purge Cloudflare Edge Cache for Sitemaps so crawlers get fresh XML immediately
    if (env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ZONE_ID) {
        try {
            const purgeRes = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        files: [
                            `${SITE_URL}/sitemap.xml`,
                            `${SITE_URL}/sitemap-images.xml`,
                            ...urlsToPing
                        ],
                    }),
                }
            );
            cachePurged = purgeRes.ok;
        } catch (err) {
            console.error('[sitemap-notifier] Cloudflare cache purge error:', err);
        }
    }

    let indexNowOk = false;
    let indexNowStatus = 0;
    // 2. Ping IndexNow (notifies Microsoft Bing, Yandex, Seznam & Naver immediately)
    try {
        const inRes = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                host: 'orbitsaas.cloud',
                key: INDEXNOW_KEY,
                keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
                urlList: urlsToPing
            })
        });
        indexNowStatus = inRes.status;
        indexNowOk = inRes.ok || inRes.status === 200 || inRes.status === 202;
    } catch (err) {
        console.error('[sitemap-notifier] IndexNow ping error:', err);
    }

    return {
        success: true,
        cachePurged,
        indexNowOk,
        indexNowStatus,
        urlsNotified: urlsToPing.length
    };
}
