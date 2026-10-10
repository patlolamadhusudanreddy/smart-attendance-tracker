import axios from 'axios';

// Detect API base URL: defaults to '/api' for Vite dev proxy or Render relative paths
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // 20s timeout for network & email operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Bearer token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session timeouts cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage =
        currentPath.includes('/login') ||
        currentPath.includes('/verify-otp') ||
        currentPath.includes('/register') ||
        currentPath.includes('/forgot-password') ||
        currentPath.includes('/reset-password');

      if (!isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
