/**
 * scripts/generate-all-share-posters.cjs
 * 
 * Generates and sets 1200x630 branded social share posters with the ORBIT SaaS
 * signature curved bottom-right branding wave for ALL existing:
 * - Projects
 * - Achievements
 * - Leadership Members
 * 
 * Formatted strictly as JPEG (<250KB) to enforce WhatsApp's rich 2-row stacked
 * card layout (Row 1: big broad banner; Row 2: title, description, link).
 * 
 * Then updates the database in Turso so WhatsApp, Facebook, LinkedIn, Twitter, etc.
 * immediately display the crisp project/achievement/member thumbnail!
 */

const { createClient } = require('@libsql/client');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TURSO_URL = 'libsql://orbitsaasportfolio-adnanshahria19.aws-ap-south-1.turso.io';
const TURSO_AUTH = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzEwMDQ0OTMsImlkIjoiNzUyNzNlYWQtNDkzMy00MWZjLWIyOWYtNDA0OWFiYzZjOGY1IiwicmlkIjoiNTRkNTc2MDAtZmUzMy00NGZlLWJkN2EtNzg0YWUxMmQwMDExIn0.UEhVL3SNwBfugL8UOVJRpRiSOyFcLFWSvAWIrBgQJ0clajL0jF-BhQa7zMCjEPETC2TY7ItkCGfbkklMMQw1Cg';
const IMGBB_KEY = '3f1800c7533a4d96e6be30e235b1bcf2';

const db = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH,
});

function extractUrl(raw) {
    if (!raw) return '';
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return extractUrl(parsed);
            } catch {}
        }
        if (trimmed.includes('|||')) return trimmed.split('|||')[0].trim();
        return trimmed;
    }
    if (typeof raw === 'object' && raw !== null) {
        return extractUrl(raw.primary) || extractUrl(raw.url) || extractUrl(raw.src) || extractUrl(raw.fallback) || '';
    }
    return '';
}

async function uploadToImgBB(buffer, filename) {
    const base64 = buffer.toString('base64');
    const form = new URLSearchParams();
    form.append('image', base64);
    const cleanName = filename.replace(/\.[^.]+$/, '') + '.jpg';
    form.append('name', cleanName);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
        method: 'POST',
        body: form,
    });
    const json = await res.json();
    if (!res.ok || !json.data?.url) {
        throw new Error('ImgBB upload error: ' + JSON.stringify(json));
    }
    return json.data.url;
}

// ── Cache for bottom-right brand wave assets ──
let cachedWaveSvg = null;
let cachedLogoBuffer = null;
let cachedTextSvg = null;

async function getBrandWaveAssets() {
    if (cachedWaveSvg && cachedLogoBuffer && cachedTextSvg) {
        return { waveSvg: cachedWaveSvg, logoBuffer: cachedLogoBuffer, textSvg: cachedTextSvg };
    }

    const width = 1200;
    const height = 630;

    // SVG for the signature curved bottom-right wave
    cachedWaveSvg = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Deep ocean navy gradient for the base corner wave -->
        <linearGradient id="mainWaveGrad" x1="0%" y1="20%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#041836" stop-opacity="0.96"/>
          <stop offset="45%" stop-color="#020f22" stop-opacity="0.98"/>
          <stop offset="100%" stop-color="#010610" stop-opacity="1.0"/>
        </linearGradient>

        <!-- Translucent outer cyan glowing wave -->
        <linearGradient id="outerCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.25"/>
          <stop offset="50%" stop-color="#0284c7" stop-opacity="0.40"/>
          <stop offset="100%" stop-color="#0369a1" stop-opacity="0.60"/>
        </linearGradient>

        <!-- Soft diffuse ambient wave -->
        <linearGradient id="ambientWave" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#075985" stop-opacity="0.25"/>
        </linearGradient>

        <linearGradient id="strokeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.75"/>
          <stop offset="100%" stop-color="#00e5ff" stop-opacity="0.20"/>
        </linearGradient>

        <!-- Drop shadow for depth -->
        <filter id="waveShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="-10" dy="-8" stdDeviation="16" flood-color="rgba(0, 10, 25, 0.75)" />
        </filter>
      </defs>

      <!-- Layer 1: Ambient soft outer wave sweep -->
      <path d="M 710 630 C 820 540 930 430 1200 355 L 1200 630 Z" fill="url(#ambientWave)" />

      <!-- Layer 2: Mid glowing cyan ripple -->
      <path d="M 760 630 C 855 530 955 430 1200 395 L 1200 630 Z" fill="url(#outerCyanGrad)" />
      <path d="M 760 630 C 855 530 955 430 1200 395" fill="none" stroke="url(#strokeGrad1)" stroke-width="2.5" />

      <!-- Layer 3: Subtle secondary accent line -->
      <path d="M 810 630 C 895 550 985 470 1200 440" fill="none" stroke="rgba(0, 229, 255, 0.35)" stroke-width="1.5" />

      <!-- Layer 4: Solid Main Deep Ocean Corner Wave with deep shadow -->
      <path d="M 835 630 C 910 575 975 490 1200 455 L 1200 630 Z" fill="url(#mainWaveGrad)" filter="url(#waveShadow)" />
      <path d="M 835 630 C 910 575 975 490 1200 455" fill="none" stroke="rgba(56, 189, 248, 0.55)" stroke-width="2" />
    </svg>
    `);

    // Prepare OrbitLogo resized to 54x54
    const logoPath = path.resolve(__dirname, '../frontend/src/assets/OrbitLogo.png');
    cachedLogoBuffer = await sharp(logoPath).resize(54, 54).toBuffer();

    // Typography for OrbitSaaS
    cachedTextSvg = Buffer.from(`
    <svg width="220" height="60" viewBox="0 0 220 60" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="44" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="800" fill="#ffffff" letter-spacing="-0.5px">
        OrbitSaaS
      </text>
    </svg>
    `);

    return { waveSvg: cachedWaveSvg, logoBuffer: cachedLogoBuffer, textSvg: cachedTextSvg };
}

/**
 * Composites a Project or Achievement Cover into 1200x630 with bottom-right OrbitSaaS wave.
 */
async function createProjectOrAchievementPoster(sourceBuffer, title) {
    const width = 1200;
    const height = 630;
    const { waveSvg, logoBuffer, textSvg } = await getBrandWaveAssets();

    // Resize background image to cover 1200x630
    const bg = await sharp(sourceBuffer)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .toBuffer();

    // Subtle dark gradient bar at the bottom for title legibility
    const bottomSvg = Buffer.from(`
        <svg width="${width}" height="140" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="rgba(8,12,22,0)"/>
                    <stop offset="100%" stop-color="rgba(8,12,22,0.85)"/>
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad)"/>
        </svg>
    `);

    const logoX = 920;
    const logoY = 525;
    const textX = 984;
    const textY = 520;

    return await sharp(bg)
        .composite([
            { input: bottomSvg, top: height - 140, left: 0 },
            { input: waveSvg, top: 0, left: 0 },
            { input: logoBuffer, top: logoY, left: logoX },
            { input: textSvg, top: textY, left: textX },
        ])
        .jpeg({ quality: 88, mozjpeg: true })
        .toBuffer();
}

/**
 * Composites a Leadership Member Executive Profile Card (1200x630) with portrait, name, role & bottom-right wave.
 */
async function createLeadershipPoster(portraitBuffer, name, role) {
    const width = 1200;
    const height = 630;
    const { waveSvg, logoBuffer, textSvg } = await getBrandWaveAssets();

    // 1. Resize portrait to 380x380 square with rounded corners
    const pSize = 380;
    const portraitResized = await sharp(portraitBuffer)
        .resize(pSize, pSize, { fit: 'cover', position: 'center' })
        .toBuffer();

    const roundedMask = Buffer.from(`
        <svg width="${pSize}" height="${pSize}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${pSize}" height="${pSize}" rx="28" fill="#fff"/>
        </svg>
    `);

    const maskedPortrait = await sharp(portraitResized)
        .composite([{ input: roundedMask, blend: 'dest-in' }])
        .png()
        .toBuffer();

    // Frame border and card details SVG
    const safeName = (name || 'Leadership Team').replace(/[<>&"]/g, '');
    const safeRole = (role || 'ORBIT SaaS').replace(/[<>&"]/g, '');

    const cardSvg = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#090e1a"/>
                    <stop offset="60%" stop-color="#050811"/>
                    <stop offset="100%" stop-color="#020408"/>
                </linearGradient>
                <radialGradient id="glow" cx="280" cy="315" r="320" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="rgba(0, 229, 255, 0.16)"/>
                    <stop offset="100%" stop-color="rgba(0, 229, 255, 0)"/>
                </radialGradient>
            </defs>

            <!-- Background -->
            <rect width="${width}" height="${height}" fill="url(#bg)"/>
            <rect width="600" height="${height}" fill="url(#glow)"/>

            <!-- Portrait border -->
            <rect x="76" y="${(height - pSize) / 2 - 4}" width="${pSize + 8}" height="${pSize + 8}" rx="32" fill="none" stroke="rgba(0, 229, 255, 0.45)" stroke-width="3"/>

            <!-- Badge -->
            <rect x="520" y="160" width="220" height="34" rx="17" fill="rgba(0, 229, 255, 0.12)" stroke="rgba(0, 229, 255, 0.4)" stroke-width="1"/>
            <text x="540" y="183" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="bold" fill="#00e5ff" letter-spacing="1.5">LEADERSHIP TEAM</text>

            <!-- Name -->
            <text x="520" y="255" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="bold" fill="#ffffff">${safeName}</text>

            <!-- Role -->
            <text x="520" y="305" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#38bdf8">${safeRole}</text>

            <!-- Company details -->
            <text x="520" y="355" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#94a3b8">ORBIT SaaS — Custom Web Development &amp; AI Agency</text>

            <!-- Verified Pill -->
            <rect x="520" y="405" width="340" height="46" rx="12" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1"/>
            <text x="545" y="434" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#cbd5e1">Official Member Profile • orbitsaas.cloud</text>
        </svg>
    `);

    const logoX = 920;
    const logoY = 525;
    const textX = 984;
    const textY = 520;

    return await sharp(cardSvg)
        .composite([
            { input: maskedPortrait, top: Math.round((height - pSize) / 2), left: 80 },
            { input: waveSvg, top: 0, left: 0 },
            { input: logoBuffer, top: logoY, left: logoX },
            { input: textSvg, top: textY, left: textX },
        ])
        .jpeg({ quality: 88, mozjpeg: true })
        .toBuffer();
}

async function run() {
    console.log('--- Starting Social Share Poster Generation (JPEG 1200x630 Bottom-Right Wave) ---');

    // 1. Process Projects
    console.log('\n[1/3] Processing Projects...');
    const pRows = await db.execute("SELECT lang, data FROM site_content WHERE section = 'projects'");
    for (const row of pRows.rows) {
        const lang = row.lang;
        const data = JSON.parse(row.data);
        const items = data.items || [];
        let updatedCount = 0;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const sourceUrl = extractUrl(item.image || item.images?.[0] || item.hoverImages?.[0]);
            if (!sourceUrl) {
                console.log(`  [Skip] Project #${i} (${item.title || item.id}): No source image`);
                continue;
            }

            console.log(`  [Project ${i + 1}/${items.length}] "${item.title || item.id}"...`);
            try {
                const imgRes = await fetch(sourceUrl);
                if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
                const sourceBuf = Buffer.from(await imgRes.arrayBuffer());

                const posterBuf = await createProjectOrAchievementPoster(sourceBuf, item.title || item.id);
                const filename = `share-project-${item.id || ('proj-' + i)}.jpg`;
                const uploadedUrl = await uploadToImgBB(posterBuf, filename);

                item.shareImage = uploadedUrl;
                item.seoCover = uploadedUrl;
                updatedCount++;
                console.log(`    ✓ Uploaded JPEG: ${uploadedUrl}`);

                // Upsert into seo_covers table
                const itemId = String(item.id || ('proj-' + i));
                await db.execute({
                    sql: `INSERT INTO seo_covers (id, item_type, item_id, title, source_image, seo_cover, updated_at)
                          VALUES (?, 'project', ?, ?, ?, ?, datetime('now'))
                          ON CONFLICT(id) DO UPDATE SET
                              title = excluded.title,
                              source_image = excluded.source_image,
                              seo_cover = excluded.seo_cover,
                              updated_at = excluded.updated_at`,
                    args: [
                        `project_${itemId}`,
                        itemId,
                        String(item.title || itemId),
                        String(sourceUrl),
                        String(uploadedUrl)
                    ]
                });
            } catch (err) {
                console.error(`    ✗ Error generating poster for project #${i}:`, err.message);
            }
        }

        if (updatedCount > 0) {
            await db.execute({
                sql: "UPDATE site_content SET data = ?, updated_at = datetime('now') WHERE section = 'projects' AND lang = ?",
                args: [JSON.stringify(data), String(lang)]
            });
            console.log(`  ✓ Updated site_content for projects (${lang}): ${updatedCount} items`);
        }
    }

    // 2. Process Achievements
    console.log('\n[2/3] Processing Achievements...');
    const aRows = await db.execute("SELECT lang, data FROM site_content WHERE section = 'achievements'");
    for (const row of aRows.rows) {
        const lang = row.lang;
        const data = JSON.parse(row.data);
        const items = data.items || [];
        let updatedCount = 0;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const sourceUrl = extractUrl(item.image);
            if (!sourceUrl) {
                console.log(`  [Skip] Achievement #${i} (${item.title || item.id}): No source image`);
                continue;
            }

            console.log(`  [Achievement ${i + 1}/${items.length}] "${item.title || item.id}"...`);
            try {
                const imgRes = await fetch(sourceUrl);
                if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
                const sourceBuf = Buffer.from(await imgRes.arrayBuffer());

                const posterBuf = await createProjectOrAchievementPoster(sourceBuf, item.title || item.id);
                const filename = `share-achievement-${item.id || ('achiev-' + i)}.jpg`;
                const uploadedUrl = await uploadToImgBB(posterBuf, filename);

                item.shareImage = uploadedUrl;
                item.seoCover = uploadedUrl;
                updatedCount++;
                console.log(`    ✓ Uploaded JPEG: ${uploadedUrl}`);

                // Upsert into seo_covers table
                const itemId = String(item.id || ('achiev-' + i));
                await db.execute({
                    sql: `INSERT INTO seo_covers (id, item_type, item_id, title, source_image, seo_cover, updated_at)
                          VALUES (?, 'achievement', ?, ?, ?, ?, datetime('now'))
                          ON CONFLICT(id) DO UPDATE SET
                              title = excluded.title,
                              source_image = excluded.source_image,
                              seo_cover = excluded.seo_cover,
                              updated_at = excluded.updated_at`,
                    args: [
                        `achievement_${itemId}`,
                        itemId,
                        String(item.title || itemId),
                        String(sourceUrl),
                        String(uploadedUrl)
                    ]
                });
            } catch (err) {
                console.error(`    ✗ Error generating poster for achievement #${i}:`, err.message);
            }
        }

        if (updatedCount > 0) {
            await db.execute({
                sql: "UPDATE site_content SET data = ?, updated_at = datetime('now') WHERE section = 'achievements' AND lang = ?",
                args: [JSON.stringify(data), String(lang)]
            });
            console.log(`  ✓ Updated site_content for achievements (${lang}): ${updatedCount} items`);
        }
    }

    // 3. Process Leadership
    console.log('\n[3/3] Processing Leadership Members...');
    const lRows = await db.execute("SELECT lang, data FROM site_content WHERE section = 'leadership'");
    for (const row of lRows.rows) {
        const lang = row.lang;
        const data = JSON.parse(row.data);
        const members = data.members || [];
        let updatedCount = 0;

        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            const sourceUrl = extractUrl(m.image);
            if (!sourceUrl) {
                console.log(`  [Skip] Member #${i} (${m.name || m.id}): No portrait image`);
                continue;
            }

            console.log(`  [Member ${i + 1}/${members.length}] "${m.name || m.id}"...`);
            try {
                const imgRes = await fetch(sourceUrl);
                if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
                const sourceBuf = Buffer.from(await imgRes.arrayBuffer());

                const posterBuf = await createLeadershipPoster(sourceBuf, m.name || m.id, m.role || 'ORBIT SaaS');
                const filename = `share-member-${m.id || ('member-' + i)}.jpg`;
                const uploadedUrl = await uploadToImgBB(posterBuf, filename);

                m.shareImage = uploadedUrl;
                m.seoCover = uploadedUrl;
                updatedCount++;
                console.log(`    ✓ Uploaded JPEG: ${uploadedUrl}`);

                // Upsert into seo_covers table
                const memberId = String(m.id || ('member-' + i));
                await db.execute({
                    sql: `INSERT INTO seo_covers (id, item_type, item_id, title, source_image, seo_cover, updated_at)
                          VALUES (?, 'leadership', ?, ?, ?, ?, datetime('now'))
                          ON CONFLICT(id) DO UPDATE SET
                              title = excluded.title,
                              source_image = excluded.source_image,
                              seo_cover = excluded.seo_cover,
                              updated_at = excluded.updated_at`,
                    args: [
                        `leadership_${memberId}`,
                        memberId,
                        String(m.name || memberId),
                        String(sourceUrl),
                        String(uploadedUrl)
                    ]
                });
            } catch (err) {
                console.error(`    ✗ Error generating poster for member #${i}:`, err.message);
            }
        }

        if (updatedCount > 0) {
            await db.execute({
                sql: "UPDATE site_content SET data = ?, updated_at = datetime('now') WHERE section = 'leadership' AND lang = ?",
                args: [JSON.stringify(data), String(lang)]
            });
            console.log(`  ✓ Updated site_content for leadership (${lang}): ${updatedCount} items`);
        }
    }

    // 4. Update content_cache for fast edge serving
    console.log('\n[4/4] Refreshing content_cache table for both languages...');
    for (const lang of ['en', 'bn']) {
        const sections = await db.execute({
            sql: 'SELECT section, data FROM site_content WHERE lang = ?',
            args: [lang]
        });
        const combined = {};
        for (const s of sections.rows) {
            combined[s.section] = JSON.parse(s.data);
        }
        await db.execute({
            sql: `INSERT INTO content_cache (lang, data, updated_at)
                  VALUES (?, ?, datetime('now'))
                  ON CONFLICT(lang) DO UPDATE SET
                      data = excluded.data,
                      updated_at = excluded.updated_at`,
            args: [lang, JSON.stringify(combined)]
        });
        console.log(`  ✓ content_cache (${lang}) refreshed.`);
    }

    console.log('\n=== All Social Share Posters Generated & Database Synchronized Successfully! ===\n');
}

run().catch(err => {
    console.error('Fatal batch generation error:', err);
    process.exit(1);
});
