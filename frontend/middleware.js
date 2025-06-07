import { NextResponse } from 'next/server';

// List of common invalid paths that we can immediately redirect
const COMMON_INVALID_PATHS = new Set([
    'favicon.ico', 'robots.txt', 'sitemap.xml', 'undefined', 'null', 
    'NaN', '[object Object]', 'undefined.js', 'undefined.css',
    'runtime.js', 'undefined.jpg', 'undefined.png', 'undefined.gif'
]);

export function middleware(request) {
    const url = new URL(request.url);
    const origin = url.origin;
    const pathname = url.pathname;
    
    // Skip middleware for authentication routes
    if (pathname.startsWith('/accounts/')) {
        return NextResponse.rewrite(new URL(pathname, origin));
    }
    
    // Only handle paths that explicitly start with /wiki/ (but not just /wiki)
    // All other unknown paths will fall through to Next.js 404 handler
    if (pathname.startsWith('/wiki/') && pathname !== '/wiki/') {
        try {
            // Extract the slug from the path - preserve the exact path without encoding
            const wikiPrefix = '/wiki/';
            const slug = pathname.slice(wikiPrefix.length);
            
            // Handle obvious invalid paths immediately
            if (slug.length === 0 || COMMON_INVALID_PATHS.has(slug)) {
                return NextResponse.redirect(new URL('/wiki', origin));
            }
            
            // If we detect an encoded URL format that should be unencoded, redirect to the unencoded version
            // This handles cases where %3A is used instead of : in the URL
            if (pathname.includes('%')) {
                try {
                    const decodedPath = decodeURIComponent(pathname);
                    // Only redirect if decoding actually changed something
                    if (decodedPath !== pathname) {
                        return NextResponse.redirect(new URL(decodedPath, origin), 301); // Permanent redirect
                    }
                } catch (error) {
                    // Error decoding path - continue with original path
                }
            }
            
            // Check for problematic characters in the URL that need special handling
            const problematicChars = {
                '–': '-', // en dash to regular hyphen
                '—': '-', // em dash to regular hyphen
            };
            
            let containsProblematicChars = false;
            let updatedSlug = slug;
            
            for (const [specialChar, replacement] of Object.entries(problematicChars)) {
                if (updatedSlug.includes(specialChar)) {
                    updatedSlug = updatedSlug.replace(new RegExp(specialChar, 'g'), replacement);
                    containsProblematicChars = true;
                }
            }
            
            if (containsProblematicChars) {
                return NextResponse.redirect(new URL(`/wiki/${updatedSlug}`, origin), 301); // Permanent redirect
            }
            
            // Skip middleware processing for direct wiki article URLs
            // This prevents valid paths from being intercepted while ensuring proper handling of special characters
            if (pathname.startsWith('/wiki/')) {
                return NextResponse.next();
            }
            
            // Handle Wiki invalid paths - redirect trailing slashes with query parameters
            // Example URL: /slug/?anything should redirect to wiki search
            if (url.search && pathname.endsWith('/')) {
                // Redirect to wiki search with the slug as a query
                return NextResponse.redirect(new URL(`/wiki?q=${slug}`, origin));
            }
            
            // Handle paths with more segments than expected (e.g., /wiki/slug/extra/segments)
            const pathSegments = pathname.split('/').filter(Boolean);
            if (pathSegments.length > 2) {
                return NextResponse.redirect(new URL(`/wiki?q=${slug}`, origin));
            }
            
            // Special check for paths that incorrectly include path=wiki in query params
            if (url.searchParams.has('path') && url.searchParams.get('path') === 'wiki') {
                // Redirect to the proper wiki path with the slug
                return NextResponse.redirect(new URL(`/wiki/${slug}`, origin));
            }
        } catch (error) {
            // Return next() to let the request continue even if there was an error in our processing
            return NextResponse.next();
        }
    }
    
    // Set request headers for all requests (both wiki and non-wiki)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-url', request.url);
    requestHeaders.set('x-origin', origin);
    requestHeaders.set('x-pathname', pathname);

    // For all other paths (non-wiki), let Next.js handle them normally
    // This allows unknown paths to fall through to the 404 page
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}
