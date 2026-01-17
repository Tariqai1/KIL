// src/api/subcategoryService.js
import apiClient from './apiClient';

/**
 * Fetches all subcategories (including parent category info).
 * @returns {Promise<Array>} List of subcategory objects.
 */
const getAllSubcategories = async () => {
    try {
        const response = await apiClient.get('/api/subcategories/');
        return response.data;
    } catch (error) {
        console.error("Error fetching subcategories:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch subcategories');
    }
};

/**
 * Creates a new subcategory.
 * @param {object} subcategoryData - { name: string, category_id: number, description?: string }.
 * @returns {Promise<object>} The newly created subcategory object.
 */
const createSubcategory = async (subcategoryData) => {
    try {
        const response = await apiClient.post('/api/subcategories/', subcategoryData);
        return response.data;
    } catch (error) {
        console.error("Error creating subcategory:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create subcategory');
    }
};

/**
 * Updates an existing subcategory.
 * @param {number} subcategoryId - The ID of the subcategory to update.
 * @param {object} subcategoryData - { name: string, category_id: number, description?: string }.
 * @returns {Promise<object>} The updated subcategory object.
 */
const updateSubcategory = async (subcategoryId, subcategoryData) => {
    try {
        const response = await apiClient.put(`/api/subcategories/${subcategoryId}`, subcategoryData);
        return response.data;
    } catch (error) {
        console.error(`Error updating subcategory ${subcategoryId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update subcategory');
    }
};

/**
 * Deletes a subcategory.
 * @param {number} subcategoryId - The ID of the subcategory to delete.
 * @returns {Promise<object>} Confirmation message.
 */
const deleteSubcategory = async (subcategoryId) => {
    try {
        const response = await apiClient.delete(`/api/subcategories/${subcategoryId}`);
        return response.data || { detail: "Subcategory deleted successfully" };
    } catch (error) {
        console.error(`Error deleting subcategory ${subcategoryId}:`, error.response?.data || error.message);
        // Pass specific backend error message (e.g., "associated with books")
        if (error.response?.status === 400 && error.response?.data?.detail) {
             throw new Error(error.response.data.detail);
        }
        throw error.response?.data || new Error('Failed to delete subcategory');
    }
};

export const subcategoryService = {
    getAllSubcategories,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
};