/**
 * scripts/generate-all-share-posters.cjs
 * 
 * Generates and sets 1200x630 branded social share posters with the ORBIT SaaS logo
 * in the TOP RIGHT CORNER for ALL existing:
 * - Projects
 * - Achievements
 * - Leadership Members
 * 
 * Then updates the database in Turso so WhatsApp, Facebook, LinkedIn, Twitter, etc.
 * immediately display the crisp project/achievement/member thumbnail with the logo!
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
    form.append('name', filename.replace(/\.[^.]+$/, ''));

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

// ── Watermark badge prepared once ──
let cachedWatermark = null;
let cachedBadgeSvg = null;
let badgeMeta = null;

async function getWatermarkAssets() {
    if (cachedWatermark && cachedBadgeSvg) return { watermark: cachedWatermark, badgeSvg: cachedBadgeSvg, badgeMeta };

    const watermarkPath = path.resolve(__dirname, '../frontend/public/orbit-watermark.png');
    cachedWatermark = await sharp(watermarkPath).resize({ width: 220 }).toBuffer();
    const wmMeta = await sharp(cachedWatermark).metadata();

    const badgeW = wmMeta.width + 36;
    const badgeH = wmMeta.height + 20;
    cachedBadgeSvg = Buffer.from(`
        <svg width="${badgeW}" height="${badgeH}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" rx="16" fill="rgba(8, 12, 22, 0.85)" stroke="rgba(0, 229, 255, 0.4)" stroke-width="1.5"/>
        </svg>
    `);

    badgeMeta = { width: badgeW, height: badgeH, wmWidth: wmMeta.width, wmHeight: wmMeta.height };
    return { watermark: cachedWatermark, badgeSvg: cachedBadgeSvg, badgeMeta };
}

/**
 * Composites a Project or Achievement Cover into 1200x630 with top-right logo badge.
 */
async function createProjectOrAchievementPoster(sourceBuffer, title) {
    const width = 1200;
    const height = 630;
    const { watermark, badgeSvg, badgeMeta } = await getWatermarkAssets();

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

    const top = 28;
    const right = 28;
    const left = width - right - badgeMeta.width;

    return await sharp(bg)
        .composite([
            { input: bottomSvg, top: height - 140, left: 0 },
            { input: badgeSvg, top: top, left: left },
            { input: watermark, top: top + 10, left: left + 18 }
        ])
        .webp({ quality: 85 })
        .toBuffer();
}

/**
 * Composites a Leadership Member Executive Profile Card (1200x630) with portrait, name, role & top-right logo.
 */
async function createLeadershipPoster(portraitBuffer, name, role) {
    const width = 1200;
    const height = 630;
    const { watermark, badgeSvg, badgeMeta } = await getWatermarkAssets();

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

    const top = 28;
    const right = 28;
    const left = width - right - badgeMeta.width;

    return await sharp(cardSvg)
        .composite([
            { input: maskedPortrait, top: Math.round((height - pSize) / 2), left: 80 },
            { input: badgeSvg, top: top, left: left },
            { input: watermark, top: top + 10, left: left + 18 }
        ])
        .webp({ quality: 85 })
        .toBuffer();
}

async function run() {
    console.log('--- Starting Social Share Poster Generation ---');

    // 1. Process Projects
    console.log('\n[1/3] Processing Projects...');
    const pRows = await db.execute("SELECT lang, data FROM site_content WHERE section = 'projects'");
    for (const row of pRows.rows) {
        const lang = row.lang;
        const data = JSON.parse(row.data);
        const items = data.items || [];
        let updatedCount = 0;

        for (const item of items) {
            const rawUrl = extractUrl(item.images?.[0] || item.image);
            if (!rawUrl) continue;

            const filename = `share-project-${item.id || 'proj'}.webp`;
            console.log(` Generating poster for project: "${item.title}" (${rawUrl.substring(0, 50)}...)`);
            try {
                const imgRes = await fetch(rawUrl);
                if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
                const buf = Buffer.from(await imgRes.arrayBuffer());

                const posterBuf = await createProjectOrAchievementPoster(buf, item.title);
                const uploadedUrl = await uploadToImgBB(posterBuf, filename);
                console.log(`  ✓ Uploaded to ImgBB: ${uploadedUrl}`);

                item.shareImage = { primary: uploadedUrl, fallback: uploadedUrl };
                updatedCount++;
            } catch (err) {
                console.error(`  ✗ Error on project "${item.title}":`, err.message);
            }
        }

        if (updatedCount > 0) {
            await db.execute({
                sql: "UPDATE site_content SET data = ? WHERE section = 'projects' AND lang = ?",
                args: [JSON.stringify(data), lang]
            });
            console.log(` Saved ${updatedCount} project posters for lang=${lang}`);
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

        for (const item of items) {
            const rawUrl = extractUrl(item.image || item.thumbnail || item.images?.[0]);
            if (!rawUrl) continue;

            const filename = `share-achievement-${item.id || 'ach'}.webp`;
            console.log(` Generating poster for achievement: "${item.title}" (${rawUrl.substring(0, 50)}...)`);
            try {
                const imgRes = await fetch(rawUrl);
                if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
                const buf = Buffer.from(await imgRes.arrayBuffer());

                const posterBuf = await createProjectOrAchievementPoster(buf, item.title);
                const uploadedUrl = await uploadToImgBB(posterBuf, filename);
                console.log(`  ✓ Uploaded to ImgBB: ${uploadedUrl}`);

                item.shareImage = { primary: uploadedUrl, fallback: uploadedUrl };
                updatedCount++;
            } catch (err) {
                console.error(`  ✗ Error on achievement "${item.title}":`, err.message);
            }
        }

        if (updatedCount > 0) {
            await db.execute({
                sql: "UPDATE site_content SET data = ? WHERE section = 'achievements' AND lang = ?",
                args: [JSON.stringify(data), lang]
            });
            console.log(` Saved ${updatedCount} achievement posters for lang=${lang}`);
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

        for (const member of members) {
            const rawUrl = extractUrl(member.image);
            if (!rawUrl) continue;

            const filename = `share-member-${member.id || 'member'}.webp`;
            console.log(` Generating executive card for member: "${member.name}" (${member.role})`);
            try {
                const imgRes = await fetch(rawUrl);
                if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
                const buf = Buffer.from(await imgRes.arrayBuffer());

                const posterBuf = await createLeadershipPoster(buf, member.name, member.role);
                const uploadedUrl = await uploadToImgBB(posterBuf, filename);
                console.log(`  ✓ Uploaded to ImgBB: ${uploadedUrl}`);

                member.shareImage = { primary: uploadedUrl, fallback: uploadedUrl };
                updatedCount++;
            } catch (err) {
                console.error(`  ✗ Error on member "${member.name}":`, err.message);
            }
        }

        if (updatedCount > 0) {
            await db.execute({
                sql: "UPDATE site_content SET data = ? WHERE section = 'leadership' AND lang = ?",
                args: [JSON.stringify(data), lang]
            });
            console.log(` Saved ${updatedCount} leadership posters for lang=${lang}`);
        }
    }

    // 4. Update content_cache
    console.log('\n[4/4] Updating content_cache for fast CDN delivery...');
    for (const lang of ['en', 'bn']) {
        const sectionsRes = await db.execute({
            sql: "SELECT section, data FROM site_content WHERE lang = ?",
            args: [lang]
        });
        const combined = {};
        for (const sRow of sectionsRes.rows) {
            try { combined[sRow.section] = JSON.parse(sRow.data); } catch {}
        }
        await db.execute({
            sql: "INSERT INTO content_cache (lang, data, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(lang) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
            args: [lang, JSON.stringify(combined)]
        });
        console.log(` content_cache refreshed for lang=${lang}`);
    }

    console.log('\n✅ All share posters generated and synced successfully!');
}

run().catch(console.error);

