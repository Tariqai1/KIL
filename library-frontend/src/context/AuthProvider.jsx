// src/context/AuthProvider.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from "jwt-decode"; 
import { authService } from '../api/authService';

// Context create karein
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // --- Global Auth State ---
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [isAuth, setIsAuth] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // --- Helper: Role Extractor ---
    // Backend kabhi string bhejta hai ("Admin") kabhi object ({ name: "Admin" })
    // Ye function sure karta hai ki humein hamesha String mile.
    const extractRole = (userData) => {
        if (!userData) return null;
        return userData.role?.name || userData.role || 'User';
    };

    /**
     * 1. Logout Action
     * Clears storage and state immediately.
     */
    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
        setRole(null);
        setIsAuth(false);
        // Hum yahan navigate nahi kar rahe taaki ye function flexible rahe.
        // UI components (Navbar/Sidebar) navigation handle karenge.
    }, []);

    /**
     * 2. Initialize Auth (App Start hone par)
     * Checks LocalStorage & Token Expiry
     */
    useEffect(() => {
        const initAuth = () => {
            try {
                const token = authService.getToken();
                const storedUser = authService.getUser();

                if (token && storedUser) {
                    // Step A: Check Token Expiry
                    const decoded = jwtDecode(token);
                    const currentTime = Date.now() / 1000;

                    if (decoded.exp < currentTime) {
                        console.warn("Token expired during startup. Logging out...");
                        logout();
                    } else {
                        // Step B: Restore Session
                        setUser(storedUser);
                        setRole(extractRole(storedUser));
                        setIsAuth(true);
                    }
                }
            } catch (error) {
                console.error("Auth Initialization Failed:", error);
                logout(); // Safety: Agar data corrupt hai to logout karo
            } finally {
                setIsLoading(false); // Loading khatam
            }
        };

        initAuth();
    }, [logout]);

    /**
     * 3. Login Action
     * Updates state after successful API login.
     * @param {Object} authData - { access_token, user: {...} }
     */
    const login = (authData) => {
        if (!authData || !authData.user) {
            console.error("Invalid login data received in AuthContext");
            return;
        }

        // State update karein (UI turant change hoga)
        setUser(authData.user);
        setRole(extractRole(authData.user));
        setIsAuth(true);
        
        // Note: Token aur User LocalStorage me `authService.login()` ke andar hi save ho chuke hain.
    };

    // Context Values jo poore app me available honge
    const value = {
        user,
        role,
        isAuth,
        isLoading,
        login,
        logout,
        isAdmin: role === 'Admin' || role === 'SuperAdmin' // Helper boolean
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;