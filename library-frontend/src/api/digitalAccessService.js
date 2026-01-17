// src/api/digitalAccessService.js
import apiClient from './apiClient';

/**
 * Fetches the digital access history for a specific user.
 * @param {number} userId - The ID of the user (client).
 * @returns {Promise<Array>} List of digital access log objects for the user.
 */
const getAccessHistoryForUser = async (userId) => {
    if (!userId) {
        // Prevent API call if no user ID is provided
        return [];
    }
    try {
        // Ensure this endpoint matches your FastAPI backend
        const response = await apiClient.get(`/api/digital-access/user/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching digital access history for user ${userId}:`, error.response?.data || error.message);
        // Handle 404 specifically (no history found) by returning an empty array
        if (error.response?.status === 404) {
            return [];
        }
        // Re-throw other errors for the component to handle
        throw error.response?.data || new Error(`Failed to fetch access history for user ${userId}`);
    }
};

// Make sure to export the function correctly
export const digitalAccessService = {
    getAccessHistoryForUser,
};