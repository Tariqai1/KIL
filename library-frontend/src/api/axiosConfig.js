// src/api/axiosConfig.js
import axios from 'axios';

// Backend URL (FastAPI default port)
const BASE_URL = 'http://127.0.0.1:8000'; 

const api = axios.create({
    baseURL: BASE_URL,
    // Default headers
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * --- REQUEST INTERCEPTOR ---
 * Har request bhejne se pehle ye function chalega.
 * Ye LocalStorage se Token nikal kar Header mein laga deta hai.
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * --- RESPONSE INTERCEPTOR ---
 * Backend se response aane par ye function chalega.
 * Agar backend "401 Unauthorized" bole, iska matlab token expire ho gaya.
 */
api.interceptors.response.use(
    (response) => {
        // Agar sab sahi hai, to response aage jane do
        return response;
    },
    (error) => {
        // Agar 401 Error aaye (Unauthorized)
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or unauthorized. Logging out...");
            
            // Storage clear karo
            localStorage.removeItem('token');
            localStorage.removeItem('user_details');
            
            // User ko Login page par bhejo (Force Redirect)
            // Note: Hum window.location use kar rahe hain taaki state poora fresh ho jaye
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;