import { cookies } from 'next/headers';

export async function fetchServer(path: string, options: RequestInit = {}) {
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
