// src/api/digitalAccessService.js
import apiClient from './apiClient';

/**
 * Logs a user's attempt to access a digital book.
 * @param {Object} accessData - { book_id, client_id, access_granted }
 */
const logAccess = async (accessData) => {
    try {
        // Backend endpoint: POST /api/digital-access/
        const response = await apiClient.post('/api/digital-access/', accessData);
        return response.data;
    } catch (error) {
        console.error("Error logging digital access:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetches the digital access history for a specific user.
 */
const getAccessHistoryForUser = async (userId) => {
    if (!userId) return [];
    try {
        const response = await apiClient.get(`/api/digital-access/user/${userId}`);
        return response.data;
    } catch (error) {
        // Agar 404 aaye (mtlb koi history nahi hai), to empty list return karein
        if (error.response?.status === 404) {
            return []; 
        }
        console.error(`Error fetching history for user ${userId}:`, error);
        throw error;
    }
};

export const digitalAccessService = {
    getAccessHistoryForUser,
    logAccess, // 👈 Ye zaroori hai!
};