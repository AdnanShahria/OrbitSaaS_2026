const ALLOWED_ORIGINS = [
    'https://orbitsaas.cloud',
    'https://www.orbitsaas.cloud',
    'http://localhost:6970',
    'http://localhost:5174',
    'http://localhost:6969',
    'http://localhost:5173',
    'http://localhost:3000',
];

/**
 * Check if the origin is allowed:
 * - Exact match in ALLOWED_ORIGINS
 * - OrbitSaaS Cloudflare Pages preview & production builds (*.orbitsaas*.pages.dev)
 * - Any subdomain of orbitsaas.cloud (*.orbitsaas.cloud)
 * - Localhost and 127.0.0.1 on any port (http/https)
 * - Local private network IPs (192.168.x.x, 10.x.x.x, 172.16.x.x - 172.31.x.x)
 */
function isOriginAllowed(origin: string): boolean {
    if (!origin) return false;
    if (ALLOWED_ORIGINS.includes(origin)) return true;

    // Cloudflare Pages preview & production builds for OrbitSaaS (*.orbitsaas*.pages.dev)
    if (/^https:\/\/([a-zA-Z0-9-]+\.)*orbitsaas(-[a-zA-Z0-9]+)?\.pages\.dev$/.test(origin)) return true;

    // Subdomains of orbitsaas.cloud (*.orbitsaas.cloud)
    if (/^https:\/\/([a-zA-Z0-9-]+\.)*orbitsaas\.cloud$/.test(origin)) return true;

    // Localhost & 127.0.0.1 on any port (http/https)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;

    // Local network IPs: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
    if (
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./.test(origin)
    ) {
        return true;
    }

    return false;
}

/**
 * Build CORS response headers based on the request origin.
 */
export function getCorsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get('origin') || '';
    const requestHeaders = request.headers.get('access-control-request-headers');

    const isAllowed = isOriginAllowed(origin);
    const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

    const defaultHeaders = 'Content-Type, Authorization, Finance-Token, X-Requested-With, Accept, Origin';
    const allowHeaders = requestHeaders ? `${defaultHeaders}, ${requestHeaders}` : defaultHeaders;

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': allowHeaders,
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
    };
}

/**
 * Handle CORS preflight OPTIONS request.
 */
export function handleOptions(request: Request): Response {
    return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request),
    });
}

/**
 * Create a JSON response with CORS headers.
 */
export function jsonResponse(
    data: unknown,
    request: Request,
    status = 200,
    extraHeaders: Record<string, string> = {}
): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request),
            ...extraHeaders,
        },
    });
}
