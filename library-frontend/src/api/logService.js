// src/api/logService.js
import apiClient from './apiClient';

/**
 * Fetches audit logs from the backend.
 * Supports optional filtering by user ID or action type, and pagination.
 * @param {object} [filters={}] - Optional filters object.
 * @param {number} [filters.userId] - Filter by user ID.
 * @param {string} [filters.actionType] - Filter by action type string.
 * @param {number} [filters.limit=100] - Number of logs to fetch.
 * @param {number} [filters.skip=0] - Number of logs to skip (for pagination).
 * @returns {Promise<Array>} List of log objects.
 * @throws {object|Error} Throws backend error detail or generic Error.
 */
const getLogs = async (filters = {}) => {
    try {
        // Prepare params object for Axios, matching backend query parameter names
        const params = {
            limit: filters.limit ?? 100, // Use nullish coalescing for default
            skip: filters.skip ?? 0,
        };
        // Use backend parameter names (user_id, action_type) if they differ from filter keys
        if (filters.userId) {
            params.user_id = filters.userId; // Match backend controller parameter
        }
        if (filters.actionType) {
            params.action_type = filters.actionType; // Match backend controller parameter
        }

        // Let Axios handle query parameter serialization
        // Ensure the base URL is correct and includes trailing slash if needed by backend
        const response = await apiClient.get('/api/logs/', { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching logs:", error.response?.data || error.message);
        // Rethrow a consistent error structure
        throw error.response?.data || { detail: error.message || 'Failed to fetch audit logs' };
    }
};

/**
 * Fetches the most recent log entries.
 * A convenience function calling getLogs.
 * @param {number} [limit=5] - Maximum number of logs to fetch.
 * @returns {Promise<Array>} List of log objects.
 * @throws {object|Error} Throws backend error detail or generic Error.
 */
const getRecentLogs = async (limit = 5) => {
    // Calls getLogs with skip=0 and the desired limit
    return getLogs({ limit: limit, skip: 0 });
};

// Export both functions for flexibility
export const logService = {
    getLogs,
    getRecentLogs,
};