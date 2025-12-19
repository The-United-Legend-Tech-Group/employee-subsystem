import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Get token from localStorage (matches login page storage key)
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');

      if (token) {
        // Add Authorization header with Bearer token for backend AuthGuard
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear tokens and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('employeeId');

        // Avoid redirect loop
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/employee/login';
        }
      }
    }

    if (error.response?.status === 403) {
      // Handle forbidden - user doesn't have required permissions
      console.error('Access denied: Insufficient permissions');
    }

    return Promise.reject(error);
  }
);

export default api;
