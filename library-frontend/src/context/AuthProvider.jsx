import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { jwtDecode } from "jwt-decode";
import { authService } from "../api/authService";

// 1. Context Create
const AuthContext = createContext();

// ✅ Standard Keys
const ACCESS_TOKEN_KEY = "access_token";
const USER_KEY = "user_details";

export const AuthProvider = ({ children }) => {
  // --- Global Auth State ---
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- Helper: Role Extractor ---
  const extractRole = (userData) => {
    if (!userData) return null;
    return userData.role?.name || userData.role || "User";
  };

  // --- Helper: Permission Extractor ---
  const extractPermissions = (userData) => {
    if (!userData) return [];
    return userData.permissions || [];
  };

  /**
   * Logout Action
   */
  const logout = useCallback(() => {
    try {
      authService.logout();
    } catch (e) {
      console.warn("authService.logout failed:", e);
    }

    setUser(null);
    setRole(null);
    setIsAuth(false);
  }, []);

  /**
   * Login Action (Normal + Google both)
   * Expected authData:
   * {
   *   access_token: "...",
   *   user: {...}
   * }
   */
  const login = useCallback((authData) => {
    if (!authData?.access_token || !authData?.user) {
      console.error("Invalid login data received", authData);
      return;
    }

    const token = authData.access_token;
    const userData = authData.user;

    // ✅ Save into correct keys (local + session safe)
    try {
      // keep localStorage as default
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (e) {
      console.warn("Storage save failed:", e);
    }

    // ✅ Update state
    setUser(userData);
    setRole(extractRole(userData));
    setIsAuth(true);
  }, []);

  /**
   * App Start: Restore Session
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = authService.getToken(); // checks local+session
        const storedUser = authService.getUser(); // checks local+session

        if (token && storedUser) {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          // Token expired?
          if (decoded?.exp && decoded.exp < currentTime) {
            console.warn("Token expired. Logging out.");
            logout();
          } else {
            setUser(storedUser);
            setRole(extractRole(storedUser));
            setIsAuth(true);
          }
        }
      } catch (error) {
        console.error("Auth Init Failed:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [logout]);

  const currentPermissions = extractPermissions(user);

  const value = {
    user,
    role,
    isAuth,
    loading, // ✅ ProtectedRoute me loading use hoga
    login,
    logout,

    // Helper flags
    isAdmin:
      String(role || "").toLowerCase() === "admin" ||
      String(role || "").toLowerCase() === "superadmin" ||
      String(role || "").toLowerCase() === "administrator",

    permissions: currentPermissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook Export
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
