import apiClient from './apiClient';

// ==========================================
// 1. 👤 USER MANAGEMENT (Admin Only)
// Base URL: /api/users/
// ==========================================

/**
 * Fetches all registered users.
 */
const getAllUsers = async () => {
    try {
        const response = await apiClient.get('/api/users/');
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch users');
    }
};

/**
 * Creates a new user.
 * @param {object} userData - { username, email, password, role_id, full_name }
 */
const createUser = async (userData) => {
    try {
        const response = await apiClient.post('/api/users/', userData);
        return response.data;
    } catch (error) {
        console.error("Error creating user:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create user');
    }
};

/**
 * Updates an existing user (Role, Status, Name).
 */
const updateUser = async (userId, userData) => {
    try {
        const response = await apiClient.put(`/api/users/${userId}/`, userData);
        return response.data;
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update user');
    }
};

/**
 * Soft deletes a user.
 */
const deleteUser = async (userId) => {
    try {
        const response = await apiClient.delete(`/api/users/${userId}/`);
        return response.data || { detail: "User deleted successfully" };
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete user');
    }
};

// ==========================================
// 2. 🛡️ ROLE MANAGEMENT (Admin Only)
// Base URL: /api/roles/  <-- (FIXED 405 ERROR HERE)
// ==========================================

/**
 * Fetches all available roles.
 */
const getAllRoles = async () => {
    try {
        // ✅ CHANGE: URL updated from /api/users/roles/ to /api/roles/
        const response = await apiClient.get('/api/roles/');
        return response.data;
    } catch (error) {
        console.error("Error fetching roles:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch roles');
    }
};

/**
 * Create a new Role (Optional, for Role Registry Page)
 */
const createRole = async (roleData) => {
    try {
        const response = await apiClient.post('/api/roles/', roleData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Failed to create role');
    }
};

/**
 * Update a Role (Name/Description)
 */
const updateRole = async (roleId, roleData) => {
    try {
        const response = await apiClient.put(`/api/roles/${roleId}/`, roleData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Failed to update role');
    }
};

/**
 * Delete a Role
 */
const deleteRole = async (roleId) => {
    try {
        await apiClient.delete(`/api/roles/${roleId}/`);
        return true;
    } catch (error) {
        throw error.response?.data || new Error('Failed to delete role');
    }
};

// ==========================================
// 3. 🏠 MY PROFILE (Logged-in User)
// Base URL: /api/profile/  <-- (UPDATED FOR NEW CONTROLLER)
// ==========================================

/**
 * Fetches current user profile (includes permissions).
 */
const getMe = async () => {
    try {
        // ✅ CHANGE: Updated path to match profile_controller
        const response = await apiClient.get('/api/profile/');
        return response.data;
    } catch (error) {
        console.error("Error fetching profile:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch profile');
    }
};

/**
 * Updates current user profile (Full Name).
 */
const updateMe = async (profileData) => {
    try {
        const response = await apiClient.put('/api/profile/', profileData);
        return response.data;
    } catch (error) {
        console.error("Error updating profile:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update profile');
    }
};

/**
 * Changes password.
 */
const changePassword = async (passwordData) => {
    try {
        const response = await apiClient.post('/api/profile/change-password/', passwordData);
        return response.data;
    } catch (error) {
        console.error("Error changing password:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to change password');
    }
};

/**
 * Fetches issued books history.
 */
const getMyIssuedBooks = async () => {
    try {
        const response = await apiClient.get('/api/profile/issued-books/');
        return response.data;
    } catch (error) {
        console.error("Error fetching history:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch book history');
    }
};

// --- NAMED EXPORT ---
export const userService = {
    // Admin - Users
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,

    // Admin - Roles
    getAllRoles,
    createRole,
    updateRole,
    deleteRole,

    // Profile
    getMe,
    updateMe,
    changePassword,
    getMyIssuedBooks,
};