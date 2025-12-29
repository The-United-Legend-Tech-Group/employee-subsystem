import { cookies } from 'next/headers';

// Next.js extended fetch options
type FetchServerOptions = RequestInit & {
    next?: {
        revalidate?: number | false;
        tags?: string[];
    };
};

export async function fetchServer(path: string, options: FetchServerOptions = {}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    const response = await fetch(`${apiUrl}${normalizedPath}`, {
        ...options,
        headers,
    });

    return response;
}
