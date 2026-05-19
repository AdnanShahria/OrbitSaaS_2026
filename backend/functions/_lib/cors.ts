const ALLOWED_ORIGINS = [
    'https://orbitsaas.cloud',
    'https://www.orbitsaas.cloud',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
];

/**
 * Build CORS response headers based on the request origin.
 */
export function getCorsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get('origin') || '';
    
    // Check if it's a local network IP: 192.168.x.x, 10.x.x.x, or 172.x.x.x
    const isLocalNetwork = origin.startsWith('http://192.168.') || 
                           origin.startsWith('http://10.') || 
                           /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./.test(origin);
                           
    const isAllowed = ALLOWED_ORIGINS.includes(origin) || 
                      origin.startsWith('http://localhost:') || 
                      isLocalNetwork;
                      
    const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
