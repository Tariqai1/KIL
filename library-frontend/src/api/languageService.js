// src/api/languageService.js

// --- FIX YAHAN HAI ---
// '{ apiClient }' ko badal kar sirf 'apiClient' kar diya gaya hai
import apiClient from './apiClient'; 
// --- END FIX ---

export const languageService = {
    
    /**
     * Sabhi languages ko fetch karta hai
     * API Endpoint: GET /api/languages/
     */
    async getAllLanguages() {
        try {
            const response = await apiClient.get('/api/languages/');
            return response.data;
        } catch (error) {
            console.error('Error fetching languages:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    },

    /**
     * Ek nayi language banata hai
     * API Endpoint: POST /api/languages/
     */
    async createLanguage(languageData) { // languageData = { name: 'New Language' }
        try {
            const response = await apiClient.post('/api/languages/', languageData);
            return response.data;
        } catch (error) {
            console.error('Error creating language:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    },

    /**
     * Ek existing language ko update karta hai
     * API Endpoint: PUT /api/languages/{id}/
     */
    async updateLanguage(languageId, languageData) { // languageData = { name: 'Updated Name' }
        try {
            const response = await apiClient.put(`/api/languages/${languageId}/`, languageData);
            return response.data;
        } catch (error) {
            console.error('Error updating language:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    },

    /**
     * Ek language ko delete karta hai
     * API Endpoint: DELETE /api/languages/{id}/
     */
    async deleteLanguage(languageId) {
        try {
            const response = await apiClient.delete(`/api/languages/${languageId}/`);
            return response.data; // Ya response.status
        } catch (error) {
            console.error('Error deleting language:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    }
};