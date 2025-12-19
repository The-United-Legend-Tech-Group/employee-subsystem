// Next.js Middleware
// This file must be named 'middleware.ts' and placed in the src/ directory
// to be automatically recognized by Next.js

import { proxy } from './proxy';

export const middleware = proxy;

// Config must be defined directly, not re-exported
export const config = {
    // Run on all paths that might need protection
    // Excluding static files, api, etc. to avoid unnecessary processing
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
