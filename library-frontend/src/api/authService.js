import api from './axiosConfig'; // Aapka configured axios instance

// Keys define kar rahe hain taaki typo na ho
const TOKEN_KEY = 'token';
const USER_KEY = 'user_details';

export const authService = {

    /**
     * 1. FULL LOGIN PROCESS
     * - Step A: Token lo (Username/Password se)
     * - Step B: Token save karo
     * - Step C: User ki profile (Role) fetch karo
     */
    async login(username, password) {
        try {
            // --- Step A: Request Token (Form Data Format) ---
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);

            // Note: Backend expects 'application/x-www-form-urlencoded'
            const tokenResponse = await api.post('/api/token', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const { access_token } = tokenResponse.data;

            if (!access_token) {
                throw new Error("Server did not return a token.");
            }

            // --- Step B: Save Token Immediately ---
            // Taaki agle request me ye header me lag ke jaye
            this.setToken(access_token);

            // --- Step C: Fetch User Profile (For Role) ---
            const userResponse = await api.get('/api/users/me/');
            const user = userResponse.data;

            // --- Step D: Save User & Return ---
            this.setUser(user);

            return {
                success: true,
                access_token,
                user
            };

        } catch (error) {
            // Agar beech me kuch fail ho jaye, to safai karo
            this.logout();
            console.error("Login Flow Failed:", error.response?.data || error.message);
            throw error; // UI ko error dikhane ke liye fek do
        }
    },

    /**
     * 2. REGISTER (Updated for Public Access)
     * * OLD: /api/users/ (Locked for Admins ❌)
     * NEW: /api/public/register (Open for everyone ✅)
     */
    async register(userData) {
        try {
            // 👇 YAHAN CHANGE KIYA HAI
            const response = await api.post('/api/public/register', userData);
            return response.data;
        } catch (error) {
            console.error("Registration Error:", error.response?.data);
            throw error;
        }
    },

    /**
     * 3. LOGOUT
     * Sab kuch clear kar deta hai
     */
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        // Optional: Reload page to clear memory states
        // window.location.reload(); 
    },

    // --- STORAGE HELPERS (Getters & Setters) ---

    setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    },

    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    setUser(user) {
        // Object ko string banakar save karo
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    getUser() {
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    // Helper: Check if user is Admin
    isAdmin() {
        const user = this.getUser();
        if (!user) return false;
        
        // Handle both Object {name: "Admin"} and String "Admin"
        const role = user.role?.name || user.role;
        return role === 'Admin' || role === 'SuperAdmin';
    }
};