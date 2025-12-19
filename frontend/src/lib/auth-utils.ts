'use client';

/**
 * Centralized authentication utilities.
 * 
 * These utilities handle cookie-based auth operations,
 * eliminating the need for localStorage token storage.
 */

// Cookie name constants (must match backend auth.controller.ts)
const COOKIE_ACCESS_TOKEN = 'access_token';
const COOKIE_EMPLOYEE_ID = 'employeeid';
const COOKIE_CANDIDATE_ID = 'candidateId';
const COOKIE_USER_ROLES = 'user_roles';

/**
 * Parse cookies from document.cookie string
 */
function parseCookies(): Record<string, string> {
    if (typeof document === 'undefined') return {};

    return document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key) {
            acc[key] = decodeURIComponent(value || '');
        }
        return acc;
    }, {} as Record<string, string>);
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
    const cookies = parseCookies();
    return cookies[name] || null;
}

/**
 * Set a cookie with optional expiration
 */
export function setCookie(name: string, value: string, days: number = 1): void {
    if (typeof document === 'undefined') return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

/**
 * Delete a cookie by setting its expiration to the past
 */
export function deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/**
 * Check if the user is authenticated (has access_token cookie)
 * Note: We can't read httpOnly cookies from JS, but we can check
 * if the employeeid cookie exists as a proxy for auth state.
 */
export function isAuthenticated(): boolean {
    const employeeId = getCookie(COOKIE_EMPLOYEE_ID);
    const candidateId = getCookie(COOKIE_CANDIDATE_ID);
    return !!(employeeId || candidateId);
}

/**
 * Get employee ID from cookie
 */
export function getEmployeeIdFromCookie(): string | null {
    return getCookie(COOKIE_EMPLOYEE_ID);
}

/**
 * Get candidate ID from cookie
 */
export function getCandidateIdFromCookie(): string | null {
    return getCookie(COOKIE_CANDIDATE_ID);
}

/**
 * Get user roles from cookie (JSON array)
 */
export function getUserRolesFromCookie(): string[] {
    const rolesJson = getCookie(COOKIE_USER_ROLES);
    if (!rolesJson) return [];

    try {
        const roles = JSON.parse(rolesJson);
        return Array.isArray(roles) ? roles : [];
    } catch {
        return [];
    }
}

/**
 * Clear all auth-related cookies and redirect to login
 */
export function logout(redirectPath: string = '/employee/login'): void {
    // Clear cookies
    deleteCookie(COOKIE_ACCESS_TOKEN);
    deleteCookie(COOKIE_EMPLOYEE_ID);
    deleteCookie(COOKIE_CANDIDATE_ID);
    deleteCookie(COOKIE_USER_ROLES);

    // Also clear localStorage for backward compatibility during migration
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('employeeId');
        localStorage.removeItem('candidateId');
    }

    // Redirect to login
    if (typeof window !== 'undefined') {
        window.location.href = redirectPath;
    }
}

/**
 * Check if user has a specific role
 */
export function hasRole(role: string): boolean {
    const roles = getUserRolesFromCookie();
    return roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(requiredRoles: string[]): boolean {
    const roles = getUserRolesFromCookie();
    return requiredRoles.some(role => roles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(requiredRoles: string[]): boolean {
    const roles = getUserRolesFromCookie();
    return requiredRoles.every(role => roles.includes(role));
}

/**
 * Get access token from cookie, with localStorage fallback.
 * For cookie-based auth, the backend sends httpOnly cookies automatically.
 * This function is for backward compatibility during migration.
 * 
 * NOTE: When using `credentials: 'include'` in fetch, the browser
 * automatically sends cookies, so the Authorization header is optional.
 * However, keeping the fallback ensures compatibility during migration.
 */
export function getAccessToken(): string | null {
    // Try cookie first (non-httpOnly token if available)
    const cookieToken = getCookie(COOKIE_ACCESS_TOKEN);
    if (cookieToken) return cookieToken;

    // Fallback to localStorage for backward compatibility
    if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('access_token');
    }

    return null;
}
