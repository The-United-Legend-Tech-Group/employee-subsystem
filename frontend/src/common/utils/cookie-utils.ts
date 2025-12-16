export const getCookie = (name: string): string | undefined => {
    if (typeof document === 'undefined') {
        console.log('🍪 getCookie: document is undefined (SSR)');
        return undefined;
    }
    console.log('🍪 All cookies:', document.cookie);
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    console.log(`🍪 Looking for cookie "${name}", found ${parts.length} parts`);
    if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        console.log(`🍪 Cookie "${name}" value:`, cookieValue);
        return cookieValue;
    }
    console.log(`🍪 Cookie "${name}" not found`);
    return undefined;
};

export const getUserRoles = (): string[] => {
    console.log('🍪 getUserRoles called');
    const rolesCookie = getCookie('user_roles');
    console.log('🍪 user_roles cookie value:', rolesCookie);
    if (!rolesCookie) {
        console.log('🍪 No user_roles cookie found, returning empty array');
        return [];
    }
    try {
        // Cookie value might be URL encoded
        const decodedCookie = decodeURIComponent(rolesCookie);
        console.log('🍪 Decoded cookie:', decodedCookie);
        const parsed = JSON.parse(decodedCookie);
        console.log('🍪 Parsed roles:', parsed);
        return parsed;
    } catch (error) {
        console.error('🍪 Failed to parse user roles cookie:', error);
        return [];
    }
};
