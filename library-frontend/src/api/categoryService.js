// src/api/categoryService.js
import apiClient from './apiClient';

// Helper to handle API errors consistently
const handleError = (error, defaultMessage = 'An error occurred') => {
    console.error("API Error:", error.response?.data || error.message);
    // Throw the specific 'detail' message from the backend if it exists
    throw error.response?.data || { detail: defaultMessage };
};

export const categoryService = {
    
    /**
     * Fetches all categories
     * API Endpoint: GET /api/categories/
     */
    getAllCategories: async () => {
        try {
            // Note: Ensure your backend uses /api/categories/
            // (Aapke main.py ke hisaab se yeh path sahi hai)
            const response = await apiClient.get('/api/categories/');
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to fetch categories');
        }
    },

    /**
     * Creates a new category
     * API Endpoint: POST /api/categories/
     */
    createCategory: async (categoryData) => { // categoryData = { name, description }
        try {
            const response = await apiClient.post('/api/categories/', categoryData);
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to create category');
        }
    },

    /**
     * Updates an existing category
     * API Endpoint: PUT /api/categories/{id}/
     */
    updateCategory: async (categoryId, categoryData) => { // categoryData = { name, description }
        try {
            const response = await apiClient.put(`/api/categories/${categoryId}/`, categoryData);
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to update category');
        }
    },

    /**
     * Deletes a category
     * API Endpoint: DELETE /api/categories/{id}/
     */
    deleteCategory: async (categoryId) => {
        try {
            const response = await apiClient.delete(`/api/categories/${categoryId}/`);
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to delete category');
        }
    },
    
    // --- Subcategory Functions (SubcategoryManagement.jsx ke liye) ---
    
    /**
     * Fetches all subcategories
     * API Endpoint: GET /api/subcategories/
     */
    getAllSubcategories: async () => {
         try {
            // Note: Ensure your backend uses /api/subcategories/
            // (Aapke main.py ke hisaab se yeh path sahi hai)
            const response = await apiClient.get('/api/subcategories/');
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to fetch subcategories');
        }
    },
    
    /**
     * Creates a new subcategory
     * API Endpoint: POST /api/subcategories/
     */
    createSubcategory: async (subcategoryData) => { // { name, description, category_id }
         try {
            const response = await apiClient.post('/api/subcategories/', subcategoryData);
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to create subcategory');
        }
    },
    
    /**
     * Updates a subcategory
     * API Endpoint: PUT /api/subcategories/{id}/
     */
    updateSubcategory: async (subcategoryId, subcategoryData) => {
         try {
            const response = await apiClient.put(`/api/subcategories/${subcategoryId}/`, subcategoryData);
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to update subcategory');
        }
    },
    
    /**
     * Deletes a subcategory
     * API Endpoint: DELETE /api/subcategories/{id}/
     */
    deleteSubcategory: async (subcategoryId) => {
         try {
            const response = await apiClient.delete(`/api/subcategories/${subcategoryId}/`);
            return response.data;
        } catch (error) {
            handleError(error, 'Failed to delete subcategory');
        }
    },
};