import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const ACCESS_TOKEN_KEY = "access_token";
export const USER_KEY = "user_details";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // ❌ JWT header use kar rahe ho, cookies nahi
  withCredentials: false,
});

// ✅ Attach token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(ACCESS_TOKEN_KEY) ||
      sessionStorage.getItem(ACCESS_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle 401 (do NOT auto redirect spam)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn("🚫 401 Unauthorized:", error.config?.url);

      // optional: just clear token (no forced redirect)
      // localStorage.removeItem(ACCESS_TOKEN_KEY);
      // localStorage.removeItem(USER_KEY);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
