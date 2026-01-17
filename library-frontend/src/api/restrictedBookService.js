// src/api/restrictedBookService.js
import apiClient from './apiClient';

/**
 * Fetches permissions assigned to a specific book.
 * @param {number} bookId - The ID of the book.
 * @returns {Promise<Array>} List of permission objects ({ id, book_id, user_id?, role_id? }).
 */
const getPermissionsForBook = async (bookId) => {
    if (!bookId) return []; // Return empty if no ID provided
    try {
        const response = await apiClient.get(`/api/book-permissions/book/${bookId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching permissions for book ${bookId}:`, error.response?.data || error.message);
        // Return empty array on 404 (no permissions found for the book)
        if (error.response?.status === 404) return [];
        throw error.response?.data || new Error(`Failed to fetch permissions for book ${bookId}`);
    }
};

/**
 * Assigns permission for a book to a user or a role.
 * @param {object} permissionData - { book_id: number, user_id?: number, role_id?: number }.
 * @returns {Promise<object>} The newly created permission object.
 */
const assignPermission = async (permissionData) => {
    try {
        const response = await apiClient.post('/api/book-permissions/', permissionData);
        return response.data;
    } catch (error) {
        console.error("Error assigning book permission:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to assign permission');
    }
};

/**
 * Revokes (deletes) a specific book permission entry.
 * @param {number} permissionId - The ID of the permission entry to revoke.
 * @returns {Promise<object>} Confirmation message.
 */
const revokePermission = async (permissionId) => {
    try {
        const response = await apiClient.delete(`/api/book-permissions/${permissionId}`);
        // Handle 204 No Content response
        return response.data || { detail: "Permission revoked successfully" };
    } catch (error) {
        console.error(`Error revoking permission ${permissionId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to revoke permission');
    }
};

// Ensure correct named export
export const restrictedBookService = {
    getPermissionsForBook,
    assignPermission,
    revokePermission,
};