// src/api/apiClient.js
import axios from 'axios';

// --- IMPORTANT FIX: Added 'export' so we can use this URL in PDF Viewer ---
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request if it exists
apiClient.interceptors.request.use(
  (config) => {
    // Support multiple possible storage keys for backward-compatibility
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;