import { isAuthenticated } from '../../../../../../lib/auth-utils';

/**
 * Utility function to download files from authenticated endpoints
 * Uses cookie-based auth (primary) with localStorage fallback
 * 
 * @param endpoint - API endpoint (e.g., '/tracking/payslips/123/download')
 * @param filename - Default filename if not provided by server
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function downloadFile(
  endpoint: string,
  filename: string
): Promise<boolean> {
  // Check both cookie-based auth and localStorage fallback
  const hasAuth = isAuthenticated() || (typeof window !== 'undefined' && localStorage.getItem('access_token'));
  if (!hasAuth) {
    console.error('Not authenticated');
    return false;
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    // Build headers - use localStorage token as fallback only
    const headers: Record<string, string> = {};
    if (!isAuthenticated()) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      credentials: 'include', // Primary: send httpOnly cookies
      headers,
    });

    if (!response.ok) {
      console.error('Failed to download file:', response.status, response.statusText);
      return false;
    }

    // Get the blob and create download link
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    // Try to get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        link.download = filenameMatch[1];
      } else {
        link.download = filename;
      }
    } else {
      link.download = filename;
    }

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (err) {
    console.error('Download Error:', err);
    return false;
  }
}



