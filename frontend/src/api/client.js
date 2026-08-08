import axios from 'axios';

/**
 * Production-grade Axios instance configured for PlacementPrepAI backend.
 * 
 * Features:
 * - Base URL from environment variable VITE_API_BASE_URL
 * - Request interceptor: automatically attaches JWT Bearer token from localStorage
 * - Response interceptor: handles 401 Unauthorized errors and API error formatting
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s timeout
});

// Request Interceptor — Attach JWT Bearer token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor — Global error handling & 401 token cleanup
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Token expired or invalid — clear local auth state
        localStorage.removeItem('access_token');
        // Custom event or redirect handling can be dispatched here
        window.dispatchEvent(new Event('auth:unauthorized'));
      }

      if (status === 429) {
        console.warn('Rate limit exceeded. Please wait before retrying.');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
