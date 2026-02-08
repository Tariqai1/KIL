import axios from "axios";

// ✅ Backend URL (local + server)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ✅ Standard Key (same everywhere)
const ACCESS_TOKEN_KEY = "access_token";
const USER_KEY = "user_details";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ✅ REQUEST INTERCEPTOR
 * Har request ke sath token attach karega
 * localStorage OR sessionStorage dono support
 */
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(ACCESS_TOKEN_KEY) ||
      sessionStorage.getItem(ACCESS_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * ✅ RESPONSE INTERCEPTOR
 * 401 aane pe logout + redirect
 * BUT login request pe redirect nahi karega
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";

      // ✅ Login endpoint pe auto logout mat karo
      const isLoginRequest =
        requestUrl.includes("/api/token") ||
        requestUrl.includes("/api/auth/google");

      if (!isLoginRequest) {
        console.warn("Session expired. Logging out...");

        // clear storage
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);

        // redirect
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
