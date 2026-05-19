// Global Cloudflare Pages Functions Middleware for API Security Headers

export const onRequest: PagesFunction = async (context) => {
    // Let the target API endpoint handle the request
    const response = await context.next();
    
    // Create a mutable copy of the response to inject headers
    const newResponse = new Response(response.body, response);
    
    // Apply global security headers to API routes
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-Frame-Options', 'DENY');
    newResponse.headers.set('X-XSS-Protection', '1; mode=block');
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    
    return newResponse;
};
