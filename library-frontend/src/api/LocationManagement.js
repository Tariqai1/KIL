// src/api/locationService.js
import apiClient from './apiClient'; // Using default import

export const locationService = {
    
    /**
     * Sabhi locations ko fetch karta hai
     * API Endpoint: GET /api/locations/
     */
    async getAllLocations() {
        try {
            const response = await apiClient.get('/api/locations/');
            return response.data;
        } catch (error) {
            console.error('Error fetching locations:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    },

    /**
     * Ek nayi location banata hai
     * API Endpoint: POST /api/locations/
     */
    async createLocation(locationData) { // locationData = { name, rack, shelf }
        try {
            const response = await apiClient.post('/api/locations/', locationData);
            return response.data;
        } catch (error) {
            console.error('Error creating location:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    },

    /**
     * Ek existing location ko update karta hai
     * API Endpoint: PUT /api/locations/{id}/
     */
    async updateLocation(locationId, locationData) { // locationData = { name, rack, shelf }
        try {
            const response = await apiClient.put(`/api/locations/${locationId}/`, locationData);
            return response.data;
        } catch (error) {
            console.error('Error updating location:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    },

    /**
     * Ek location ko delete karta hai
     * API Endpoint: DELETE /api/locations/{id}/
     */
    async deleteLocation(locationId) {
        try {
            const response = await apiClient.delete(`/api/locations/${locationId}/`);
            return response.data; // Ya response.status
        } catch (error)
        {
            console.error('Error deleting location:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    }
};