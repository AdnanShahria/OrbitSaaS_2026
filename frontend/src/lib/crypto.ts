/**
 * Shared AES-GCM Encryption Utility for Payload Security
 * 
 * Works in both the browser (Frontend) and Cloudflare Workers (Backend)
 * using the native Web Crypto API.
 */

// We need a stable key for symmetric encryption between client and server.
// In a real production environment with high security requirements, this would be
// derived from a user session, or using asymmetric encryption (RSA/ECC).
// For this SaaS, we'll use a derived key from the environment variable (backend)
// and an environment variable (frontend) to encrypt the payload.

const ENCRYPTION_SECRET = import.meta.env ? import.meta.env.VITE_PAYLOAD_SECRET || 'orbit-admin-jwt-secret-2025' : 'orbit-admin-jwt-secret-2025';

// Helper to convert string to ArrayBuffer
function str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

// Helper to convert ArrayBuffer to hex string
function ab2hex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
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

async function getKey(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("orbit_saas_salt_2024"),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypt a JSON payload
 * Returns a hex string: IV + Ciphertext
 */
export async function encryptPayload(data: any, secretOverride?: string): Promise<string> {
    const secret = secretOverride || ENCRYPTION_SECRET;
    if (!secret) return JSON.stringify(data); // Fallback if no secret configured

    const key = await getKey(secret);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encoded = enc.encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoded
    );

    const ivHex = ab2hex(iv.buffer);
    const cipherHex = ab2hex(ciphertext);
    
    // Format: version:iv:ciphertext
    return `v1:${ivHex}:${cipherHex}`;
}

/**
 * Decrypt a payload payload
 */
export async function decryptPayload(encryptedHex: string, secretOverride?: string): Promise<any> {
    const secret = secretOverride || ENCRYPTION_SECRET;
    if (!secret || !encryptedHex.startsWith('v1:')) {
        // Fallback or unencrypted
        try { return JSON.parse(encryptedHex); } catch { return null; }
    }

    try {
        const parts = encryptedHex.split(':');
        if (parts.length !== 3) return null;
        
        const [, ivHex, cipherHex] = parts;
        const key = await getKey(secret);
        const iv = hex2ab(ivHex);
        const ciphertext = hex2ab(cipherHex);

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(iv) },
            key,
            ciphertext
        );

        const dec = new TextDecoder();
        const jsonStr = dec.decode(decrypted);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Payload decryption failed", e);
        return null;
    }
}
