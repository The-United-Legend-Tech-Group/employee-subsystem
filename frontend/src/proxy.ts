import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define RouteConfig type locally used for the internal configuration
type RouteConfig = {
    [pathPattern: string]: string[]; // string[] allows flexible role names
};

// Available Roles for Reference (from SystemRole enum):
// 'department employee', 'department head', 'HR Manager', 'HR Employee', 'Payroll Specialist',
// 'System Admin', 'Legal & Policy Admin', 'Recruiter', 'Finance Staff', 'Job Candidate',
// 'HR Admin', 'Payroll Manager'

/**
 * Decode JWT payload without verification (for role checking in middleware)
 * Note: This only decodes the payload, it does not verify the signature
 */
function decodeJwtPayload(token: string): { roles?: string[] } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = parts[1];
        // Base64Url decode
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // --- CONFIGURATION START ---

    // Define your role-based route protection rules here.
    // The keys are the URL path prefixes to protect.
    // The values are arrays of allowed role strings.
    // If a user navigates to a path starting with a key, they must have at least one of the listed roles.

    const protectedRoutes: RouteConfig = { //USE THIS 
        // Example:
        // '/employee/manage-employees': ['HR Manager', 'System Admin'],
        // '/employee/admin': ['System Admin'],
        '/employee/manage-employees': ['HR Admin'],
        '/employee/team': ['department head'],
        '/employee/manage-organization': ['System Admin'],
        '/employee/manage-requests': ['HR Admin'],
        '/employee/compose-notification': ['System Admin', 'HR Admin', 'HR Manager', 'department head'],
        '/employee/structure-request': ['department head'],
        '/employee/manage-structure-requests': ['System Admin'],
        '/employee/performance/dashboard': ['HR Manager'],
        '/employee/performance/templates': ['HR Manager'],
        '/employee/performance/cycles': ['HR Manager'],
        '/employee/performance/assignments': ['HR Employee'],
        '/employee/performance/monitoring': ['HR Employee'],
        '/employee/performance/manager': ['department head'],
        '/employee/performance/manager-assignments': ['HR Employee'],
        //'/employee/performance/my-records' : ['department employee'],
        '/employee/performance/manage-disputes': ['HR Manager'],
        '/employee/performance/disputes': ['HR Employee', 'department employee'],
        '/employee/recruitment_sub/hr-employee' : ['HR Employee', 'HR Manager'],
        '/employee/recruitment_sub/employee' : ['department employee'],
        '/employee/recruitment_sub/hr-manager' : ['HR Manager'],
        '/employee/recruitment_sub/system-admin' : ['System Admin'],
        

        // Payroll Config Setup
        '/employee/payroll/config_setup': [
            'Payroll Specialist',
            'Payroll Manager',
            'System Admin',
            'Legal & Policy Admin',
            'HR Manager'
        ],
        // Payroll Execution
        '/employee/payroll/execution': [
            'Payroll Specialist',
            'Payroll Manager',
            'Finance Staff'
        ],
        // Payroll Tracking - Specialist Services
        '/employee/payroll/tracking/specialist-services': [
            'Payroll Specialist'
        ],
        // Payroll Tracking - Manager Services
        '/employee/payroll/tracking/manager-services': [
            'Payroll Manager'
        ],
        // Payroll Tracking - Finance Services
        '/employee/payroll/tracking/finance-services': [
            'Finance Staff'
        ],
    };

    // --- CONFIGURATION END ---

    // Find the most specific matching configured route (longest matching prefix)
    const matchingPath = Object.keys(protectedRoutes)
        .sort((a, b) => b.length - a.length)
        .find(path => pathname.startsWith(path));

    if (matchingPath) {
        const allowedRoles = protectedRoutes[matchingPath];
        const accessToken = request.cookies.get('access_token');

        // Check if token exists
        if (!accessToken || !accessToken.value) {
            // Redirect to unauthorized page if no token found
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        try {
            // Extract roles from JWT token payload
            const payload = decodeJwtPayload(accessToken.value);
            const userRoles: string[] = payload?.roles || [];

            // Check if user has any of the allowed roles
            const hasPermission = userRoles.some(role => allowedRoles.includes(role));

            if (!hasPermission) {
                // Redirect to unauthorized page if role check fails
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }

        } catch (error) {
            // Failsafe for corrupted token
            console.error('Middleware: Error parsing access_token:', error);
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    // Run on all paths that might need protection
    // Excluding static files, api, etc. to avoid unnecessary processing
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

