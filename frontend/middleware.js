import { NextResponse } from 'next/server';

export function middleware(request) {
    const url = new URL(request.url);
    const origin = url.origin;
    const pathname = url.pathname;
    
    // Skip middleware for authentication routes
    if (pathname.startsWith('/accounts/')) {
        console.log('[Middleware] Bypassing authentication route:', pathname);
        return NextResponse.rewrite(new URL(pathname, origin));
    }
    
    const requestHeaders = new Headers(request.headers);

    requestHeaders.set('x-url', request.url);
    requestHeaders.set('x-origin', origin);
    requestHeaders.set('x-pathname', pathname);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}
