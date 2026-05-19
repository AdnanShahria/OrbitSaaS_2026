import { getDb } from '../_lib/db';
import { handleOptions, jsonResponse } from '../_lib/cors';
import { isAuthorized } from '../_lib/auth';
import type { Env } from '../_lib/types';

// ─── Web Crypto VAPID helpers (Cloudflare Workers compatible) ───

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function uint8ArrayToUrlBase64(uint8Array: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importVapidKeys(publicKeyB64: string, privateKeyB64: string) {
    const publicKeyBytes = urlBase64ToUint8Array(publicKeyB64);
    const privateKeyBytes = urlBase64ToUint8Array(privateKeyB64);

    // The raw private key is 32 bytes (256 bits) for P-256
    // We need to construct the JWK from raw keys
    const x = uint8ArrayToUrlBase64(publicKeyBytes.slice(1, 33)); // skip 0x04 prefix
    const y = uint8ArrayToUrlBase64(publicKeyBytes.slice(33, 65));
    const d = uint8ArrayToUrlBase64(privateKeyBytes);

    const privateKey = await crypto.subtle.importKey(
        'jwk',
        { kty: 'EC', crv: 'P-256', x, y, d, ext: true },
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
    );

    return { privateKey, publicKeyBytes };
}

async function createVapidAuthHeader(
    audience: string,
    subject: string,
    publicKeyB64: string,
    privateKeyB64: string
): Promise<{ authorization: string; cryptoKey: string }> {
    const { privateKey, publicKeyBytes } = await importVapidKeys(publicKeyB64, privateKeyB64);

    const header = { typ: 'JWT', alg: 'ES256' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        aud: audience,
        exp: now + 12 * 60 * 60, // 12 hours
        sub: subject,
    };

    const encoder = new TextEncoder();
    const headerB64 = uint8ArrayToUrlBase64(encoder.encode(JSON.stringify(header)));
    const payloadB64 = uint8ArrayToUrlBase64(encoder.encode(JSON.stringify(payload)));
    const unsignedToken = `${headerB64}.${payloadB64}`;

    const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: { name: 'SHA-256' } },
        privateKey,
        encoder.encode(unsignedToken)
    );

    // Convert DER signature to raw r||s format if needed
    const sigBytes = new Uint8Array(signature);
    let rawSig: Uint8Array;
    if (sigBytes.length === 64) {
        rawSig = sigBytes;
    } else {
        // DER format: 0x30 len 0x02 rlen r 0x02 slen s
        const rLen = sigBytes[3];
        const r = sigBytes.slice(4, 4 + rLen);
        const sLen = sigBytes[5 + rLen];
        const s = sigBytes.slice(6 + rLen, 6 + rLen + sLen);
        rawSig = new Uint8Array(64);
        rawSig.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32));
        rawSig.set(s.length > 32 ? s.slice(s.length - 32) : s, 64 - Math.min(s.length, 32));
    }

    const token = `${unsignedToken}.${uint8ArrayToUrlBase64(rawSig)}`;
    const cryptoKeyHeader = uint8ArrayToUrlBase64(publicKeyBytes);

    return {
        authorization: `vapid t=${token}, k=${cryptoKeyHeader}`,
        cryptoKey: `p256ecdsa=${cryptoKeyHeader}`,
    };
}

// ─── Encrypt push payload using Web Push encryption (aes128gcm) ───

async function encryptPayload(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payloadText: string
): Promise<{ body: ArrayBuffer; headers: Record<string, string> }> {
    const payload = new TextEncoder().encode(payloadText);

    // Import subscriber's public key
    const subscriberPubKeyBytes = urlBase64ToUint8Array(subscription.keys.p256dh);
    const subscriberPubKey = await crypto.subtle.importKey(
        'raw',
        subscriberPubKeyBytes,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
    );

    // Import subscriber's auth secret
    const authSecret = urlBase64ToUint8Array(subscription.keys.auth);

    // Generate our own ECDH key pair
    const localKeyPair = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveBits']
    ) as CryptoKeyPair;

    // Derive shared secret via ECDH
    const sharedSecret = await crypto.subtle.deriveBits(
        { name: 'ECDH', public: subscriberPubKey } as any,
        localKeyPair.privateKey,
        256
    );

    // Export our public key (for the Crypto-Key header)
    const localPubKeyBytes = new Uint8Array(
        await crypto.subtle.exportKey('raw', localKeyPair.publicKey) as ArrayBuffer
    );

    // Generate a 16-byte salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // HKDF-based key derivation (Web Push RFC 8291)
    const sharedSecretKey = await crypto.subtle.importKey(
        'raw', sharedSecret, { name: 'HKDF' }, false, ['deriveBits']
    );

    // PRK = HKDF-Extract(auth_secret, ecdh_secret)
    const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
    const prkBits = await crypto.subtle.deriveBits(
        { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: authInfo },
        sharedSecretKey,
        256
    );

    const prkKey = await crypto.subtle.importKey(
        'raw', prkBits, { name: 'HKDF' }, false, ['deriveBits']
    );

    // Build context for key/nonce derivation
    // keyInfo = "Content-Encoding: aes128gcm" + 0x00
    // nonceInfo = "Content-Encoding: nonce" + 0x00
    const keyInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
    const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');

    const keyBits = await crypto.subtle.deriveBits(
        { name: 'HKDF', hash: 'SHA-256', salt: salt, info: keyInfo },
        prkKey,
        128
    );

    const nonceBits = await crypto.subtle.deriveBits(
        { name: 'HKDF', hash: 'SHA-256', salt: salt, info: nonceInfo },
        prkKey,
        96
    );

    // Encrypt with AES-128-GCM
    const contentKey = await crypto.subtle.importKey(
        'raw', keyBits, { name: 'AES-GCM' }, false, ['encrypt']
    );

    // Pad the payload: add a delimiter byte (0x02) and optional padding
    const paddedPayload = new Uint8Array(payload.length + 1);
    paddedPayload.set(payload);
    paddedPayload[payload.length] = 2; // delimiter

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: new Uint8Array(nonceBits), tagLength: 128 },
        contentKey,
        paddedPayload
    );

    // Build aes128gcm header: salt(16) + rs(4) + keyIdLen(1) + keyId(65)
    const recordSize = 4096;
    const header = new ArrayBuffer(16 + 4 + 1 + localPubKeyBytes.length);
    const headerView = new DataView(header);
    new Uint8Array(header).set(salt, 0);
    headerView.setUint32(16, recordSize, false);
    headerView.setUint8(20, localPubKeyBytes.length);
    new Uint8Array(header).set(localPubKeyBytes, 21);

    // Combine header + encrypted content
    const body = new Uint8Array(header.byteLength + encrypted.byteLength);
    body.set(new Uint8Array(header), 0);
    body.set(new Uint8Array(encrypted), header.byteLength);

    return {
        body: body.buffer,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'Content-Length': String(body.byteLength),
        },
    };
}

// ─── Send push to a single subscription ───
async function sendPushToSubscription(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
    env: Env
): Promise<boolean> {
    try {
        const url = new URL(subscription.endpoint);
        const audience = `${url.protocol}//${url.host}`;

        const { authorization } = await createVapidAuthHeader(
            audience,
            `mailto:${env.VAPID_EMAIL}`,
            env.VAPID_PUBLIC_KEY,
            env.VAPID_PRIVATE_KEY
        );

        const encrypted = await encryptPayload(subscription, payload);

        const res = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
                ...encrypted.headers,
                Authorization: authorization,
                TTL: '86400',
                Urgency: 'normal',
            },
            body: encrypted.body,
        });

        return res.status >= 200 && res.status < 300;
    } catch (err) {
        console.error('Push send failed:', err);
        return false;
    }
}

// ─── Action: Subscribe (public) ───
async function handleSubscribe(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const body = await request.json() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
    };

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
        return jsonResponse({ error: 'Invalid subscription object' }, request, 400);
    }

    const db = getDb(env);

    // Ensure table exists
    await db.execute(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    // Upsert subscription
    await db.execute({
        sql: `INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)
              ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`,
        args: [body.endpoint, body.keys.p256dh, body.keys.auth],
    });

    return jsonResponse({ success: true, message: 'Subscription saved' }, request);
}

// ─── Action: Send notification (admin) ───
async function handleSend(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);
    if (!(await isAuthorized(request, env.JWT_SECRET))) {
        return jsonResponse({ error: 'Unauthorized' }, request, 401);
    }

    const body = await request.json() as {
        title?: string;
        body?: string;
        url?: string;
    };

    if (!body.title || !body.body) {
        return jsonResponse({ error: 'Title and body are required' }, request, 400);
    }

    const db = getDb(env);

    // Ensure table exists
    await db.execute(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    const result = await db.execute('SELECT endpoint, p256dh, auth FROM push_subscriptions');
    const subscriptions = result.rows as unknown as Array<{ endpoint: string; p256dh: string; auth: string }>;

    if (subscriptions.length === 0) {
        return jsonResponse({ success: false, message: 'No subscribers found' }, request, 404);
    }

    const payload = JSON.stringify({
        title: body.title,
        body: body.body,
        url: body.url || '/',
    });

    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    // Send in batches of 10
    for (let i = 0; i < subscriptions.length; i += 10) {
        const batch = subscriptions.slice(i, i + 10);
        const results = await Promise.allSettled(
            batch.map(async (sub) => {
                const success = await sendPushToSubscription(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    payload,
                    env
                );
                if (!success) {
                    expiredEndpoints.push(sub.endpoint);
                }
                return success;
            })
        );

        for (const r of results) {
            if (r.status === 'fulfilled' && r.value) sent++;
            else failed++;
        }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
        for (const ep of expiredEndpoints) {
            await db.execute({ sql: 'DELETE FROM push_subscriptions WHERE endpoint = ?', args: [ep] });
        }
    }

    // Log the notification
    await db.execute(`
        CREATE TABLE IF NOT EXISTS notification_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            url TEXT,
            sent_count INTEGER DEFAULT 0,
            failed_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    await db.execute({
        sql: `INSERT INTO notification_log (title, body, url, sent_count, failed_count) VALUES (?, ?, ?, ?, ?)`,
        args: [body.title, body.body, body.url || '/', sent, failed],
    });

    return jsonResponse({
        success: true,
        message: `Notification sent to ${sent} subscribers (${failed} failed)`,
        sent,
        failed,
    }, request);
}

// ─── Action: Stats (admin) ───
async function handleStats(request: Request, env: Env): Promise<Response> {
    if (!(await isAuthorized(request, env.JWT_SECRET))) {
        return jsonResponse({ error: 'Unauthorized' }, request, 401);
    }

    const db = getDb(env);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS notification_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            url TEXT,
            sent_count INTEGER DEFAULT 0,
            failed_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    const countResult = await db.execute('SELECT COUNT(*) as count FROM push_subscriptions');
    const subscribers = Number(countResult.rows[0]?.count || 0);

    const historyResult = await db.execute('SELECT * FROM notification_log ORDER BY created_at DESC LIMIT 20');

    return jsonResponse({
        subscribers,
        history: historyResult.rows,
    }, request);
}

// ─── Main Router ───
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || '';

    try {
        switch (action) {
            case 'subscribe': return await handleSubscribe(request, env);
            case 'send': return await handleSend(request, env);
            case 'stats': return await handleStats(request, env);
            default: return jsonResponse({ error: 'Unknown action. Use ?action=subscribe|send|stats' }, request, 400);
        }
    } catch (error) {
        console.error('Notifications API error:', error);
        return jsonResponse({ error: 'Internal server error' }, request, 500);
    }
};
