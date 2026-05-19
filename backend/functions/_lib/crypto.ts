/**
 * Backend AES-GCM Encryption Utility for Payload Security
 */

// Helper to convert ArrayBuffer to hex string
function ab2hex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

// Helper to convert hex string to ArrayBuffer
function hex2ab(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes.buffer;
}

// Ensure crypto is available (Cloudflare Workers has native web crypto api)
const cryptoVar = typeof crypto !== 'undefined' ? crypto : (globalThis as any).crypto;

async function getKey(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await cryptoVar.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    return cryptoVar.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode('orbit_saas_salt_2024'),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt a JSON payload
 */
export async function encryptPayload(data: any, secret: string): Promise<string> {
    const key = await getKey(secret);
    const iv = cryptoVar.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encoded = enc.encode(JSON.stringify(data));

    const ciphertext = await cryptoVar.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoded
    );

    const ivHex = ab2hex(iv.buffer);
    const cipherHex = ab2hex(ciphertext);

    return `v1:${ivHex}:${cipherHex}`;
}

/**
 * Decrypt a payload
 */
export async function decryptPayload(encryptedHex: string, secret: string): Promise<any> {
    if (!encryptedHex || !encryptedHex.startsWith('v1:')) {
        // Fallback for unencrypted payloads
        try {
            return JSON.parse(encryptedHex);
        } catch {
            return null;
        }
    }

    try {
        const parts = encryptedHex.split(':');
        if (parts.length !== 3) return null;

        const [, ivHex, cipherHex] = parts;
        const key = await getKey(secret);
        const iv = hex2ab(ivHex);
        const ciphertext = hex2ab(cipherHex);

        const decrypted = await cryptoVar.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv) },
            key,
            ciphertext
        );

        const dec = new TextDecoder();
        const jsonStr = dec.decode(decrypted);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Payload decryption failed', e);
        return null;
    }
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
    const encoder = new TextEncoder();
    const aBuffer = encoder.encode(a);
    const bBuffer = encoder.encode(b);
    
    if (aBuffer.byteLength !== bBuffer.byteLength) {
        return false;
    }
    
    let result = 0;
    for (let i = 0; i < aBuffer.byteLength; i++) {
        result |= aBuffer[i] ^ bBuffer[i];
    }
    
    return result === 0;
}
