// src/api/userService.js
import apiClient from './apiClient';

// --- FUNCTION DEFINITIONS ---

/**
 * Fetches all registered users (Admin only).
 * API Endpoint: GET /api/users/
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
 * Fetches all available roles (for dropdowns).
 * API Endpoint: GET /api/users/roles/
 */
const getAllRoles = async () => {
    try {
        const response = await apiClient.get('/api/users/roles/');
        return response.data;
    } catch (error) {
        console.error("Error fetching roles:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch roles');
    }
};

/**
 * Creates a new user (Admin only).
 * API Endpoint: POST /api/users/
 * @param {object} userData - { username, email, password, role_id, full_name }
 * @returns {Promise<object>} The newly created user object.
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
 * Updates an existing user (Admin only).
 * API Endpoint: PUT /api/users/{id}/
 * @param {number} userId - The ID of the user to update.
 * @param {object} userData - { full_name, role_id, status }
 * @returns {Promise<object>} The updated user object.
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
 * Deletes a user (soft delete) (Admin only).
 * API Endpoint: DELETE /api/users/{id}/
 * @param {number} userId - The ID of the user to delete.
 * @returns {Promise<object>} Confirmation message.
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


// --- "MY PROFILE" FUNCTIONS ---

/**
 * Fetches the profile for the *currently logged-in* user.
 * API Endpoint: GET /api/users/me/
 * @returns {Promise<object>} The current user's object.
 */
const getMe = async () => {
    try {
        const response = await apiClient.get('/api/users/me/');
        return response.data;
    } catch (error) {
        console.error("Error fetching current user profile:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch profile');
    }
};

/**
 * Updates the profile for the *currently logged-in* user.
 * API Endpoint: PUT /api/users/me/
 * @param {object} profileData - { full_name, email (if allowed) }
 * @returns {Promise<object>} The updated user object.
 */
const updateMe = async (profileData) => {
    try {
        const response = await apiClient.put('/api/users/me/', profileData);
        return response.data;
    } catch (error) {
        console.error("Error updating current user profile:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update profile');
    }
};

/**
 * Changes the password for the *currently logged-in* user.
 * API Endpoint: POST /api/users/me/change-password/
 * @param {object} passwordData - { current_password, new_password, confirm_password }
 * @returns {Promise<object>} Success message.
 */
const changePassword = async (passwordData) => {
    try {
        const response = await apiClient.post('/api/users/me/change-password/', passwordData);
        return response.data; // Will likely be empty on success (204 No Content)
    } catch (error) {
        console.error("Error changing password:", error.response?.data || error.message);
        // Important: throw the error.detail from the backend (e.g., "Incorrect current password.")
        throw error.response?.data || new Error('Failed to change password');
    }
};

/**
 * Fetches the issued book history for the *currently logged-in* user.
 * API Endpoint: GET /api/users/me/issued-books/
 * @returns {Promise<Array>} List of issue records.
 */
const getMyIssuedBooks = async () => {
    try {
        const response = await apiClient.get('/api/users/me/issued-books/');
        return response.data;
    } catch (error) {
        console.error("Error fetching issued books history:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch book history');
    }
};

// --- NAMED EXPORT ---
export const userService = {
    // Admin functions
    getAllUsers,
    getAllRoles,
    createUser,
    updateUser,
    deleteUser,

    // "My Profile" functions
    getMe,
    updateMe,
    changePassword,
    getMyIssuedBooks,
};