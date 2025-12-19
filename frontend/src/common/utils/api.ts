// API utility functions for payroll tracking
import { getEmployeeIdFromCookie } from '../../lib/auth-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';

/**
 * Make an authenticated API request.
 * Uses credentials: 'include' to send httpOnly cookies automatically.
 * Falls back to localStorage token during migration.
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Fallback to localStorage token during migration
  const token = typeof localStorage !== 'undefined'
    ? localStorage.getItem('access_token')
    : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Only add Authorization header if fallback token exists
  // httpOnly cookie is sent automatically via credentials: 'include'
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Sends httpOnly cookies automatically
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response;
}

/**
 * Get the current employee ID.
 * First checks cookie, then falls back to localStorage during migration.
 */
export async function getEmployeeId(): Promise<string> {
  // Try cookie first (new approach)
  const cookieEmployeeId = getEmployeeIdFromCookie();
  if (cookieEmployeeId) {
    return cookieEmployeeId;
  }

  // Fallback to localStorage during migration
  const token = localStorage.getItem('access_token');
  const encryptedEmployeeId = localStorage.getItem('employeeId');

  if (!token || !encryptedEmployeeId) {
    throw new Error('Not authenticated');
  }

  const { decryptData } = await import('./encryption');
  return await decryptData(encryptedEmployeeId, token);
}
