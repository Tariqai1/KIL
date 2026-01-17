// src/api/locationService.js
import apiClient from './apiClient';

/**
 * Fetches all locations.
 * API: GET /api/locations/
 */
const getAllLocations = async () => {
    try {
        const response = await apiClient.get('/api/locations/');
        return response.data;
    } catch (error) {
        console.error("Error fetching locations:", error.response?.data || error.message);
        throw error.response?.data || { detail: 'Failed to fetch locations' };
    }
};

/**
 * Creates a new location.
 * API: POST /api/locations/
 * @param {object} locationData - { name, description, etc. }
 */
const createLocation = async (locationData) => {
    try {
        const response = await apiClient.post('/api/locations/', locationData);
        return response.data;
    } catch (error) {
        console.error("Error creating location:", error.response?.data || error.message);
        throw error.response?.data || { detail: 'Failed to create location' };
    }
};

/**
 * Updates an existing location.
 * API: PUT /api/locations/{id}/
 */
const updateLocation = async (locationId, locationData) => {
    try {
        const response = await apiClient.put(`/api/locations/${locationId}/`, locationData);
        return response.data;
    } catch (error) {
        console.error(`Error updating location ${locationId}:`, error.response?.data || error.message);
        throw error.response?.data || { detail: 'Failed to update location' };
    }
};

/**
 * Deletes a location.
 * API: DELETE /api/locations/{id}/
 */
const deleteLocation = async (locationId) => {
    try {
        const response = await apiClient.delete(`/api/locations/${locationId}/`);
        return response.data || { detail: "Location deleted successfully" };
    } catch (error) {
        console.error(`Error deleting location ${locationId}:`, error.response?.data || error.message);
        // Specific handling for foreign key constraint (if location is used in books)
        if (error.response?.status === 400 || error.response?.status === 500) {
             throw { detail: 'Cannot delete location: It might be associated with existing books.' };
        }
        throw error.response?.data || { detail: 'Failed to delete location' };
    }
};

// Exporting as a single object to maintain compatibility
export const locationService = {
    getAllLocations,
    createLocation,
    updateLocation,
    deleteLocation,
};