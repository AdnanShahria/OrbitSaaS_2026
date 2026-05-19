import { SignJWT, jwtVerify } from 'jose';

/**
 * Sign a JWT token using jose (Web Crypto API — Workers-compatible).
 * Replaces jsonwebtoken which requires Node.js crypto.
 */
export async function signToken(payload: Record<string, unknown>, secret: string): Promise<string> {
    const secretKey = new TextEncoder().encode(secret);
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secretKey);
}

/**
 * Verify a JWT token and return its payload, or null if invalid.
 */
export async function verifyToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
    try {
        const secretKey = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(token, secretKey);
        return payload as Record<string, unknown>;
    } catch {
        return null;
    }
}

/**
 * Extract Bearer token from request Authorization header.
 */
export function getTokenFromRequest(req: Request): string | null {
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return null;
}

/**
 * Check if a request carries a valid admin JWT.
 */
export async function isAuthorized(req: Request, secret: string): Promise<boolean> {
    const token = getTokenFromRequest(req);
    if (!token) return false;
    return (await verifyToken(token, secret)) !== null;
}
