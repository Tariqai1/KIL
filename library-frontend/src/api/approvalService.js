import apiClient from './apiClient';

// ✅ FIX 1: Add '/api' prefix explicitly
// Agar aapka apiClient baseURL already '/api' rakhta hai to ye '/api/api/requests' ho jayega
// Isliye hum safer side ke liye relative path use karte hain jo 'apiClient' handle karega.
// Lekin agar 404 aa raha hai, to iska matlab path match nahi ho raha.
// Hum yahan hardcode kar dete hain taake ghalti ki gunjaish na rahe.

const BASE_URL = '/api/requests'; 

export const approvalService = {
    
    // ============================================================
    // 📤 UPLOAD REQUESTS (Staff <-> Admin)
    // ============================================================

    /**
     * STAFF: Create a request to approve a new book upload.
     */
    createUploadRequest: async (bookId) => {
        try {
            const response = await apiClient.post(`${BASE_URL}/upload`, { book_id: bookId });
            return response.data;
        } catch (error) {
            console.error("Error creating upload request:", error);
            throw error.response?.data || error;
        }
    },

    /**
     * ✅ FIX 2: Aliased Function (Purana naam wapas dala hai)
     * Agar aapka component 'getAllRequests' dhund raha hai, to ye use mil jayega.
     */
    getAllRequests: async (status = null) => {
        return await approvalService.getAllUploadRequests(status);
    },

    /**
     * ADMIN: Get all pending upload requests.
     */
    getAllUploadRequests: async (status = null) => {
        try {
            const params = status ? { status_filter: status } : {};
            // URL ab /api/requests/upload banega
            const response = await apiClient.get(`${BASE_URL}/upload`, { params });
            return response.data;
        } catch (error) {
            console.error("Error fetching upload requests:", error);
            throw error.response?.data || error;
        }
    },

    /**
     * ✅ FIX 3: Aliased Function for Review (Purana naam)
     */
    reviewRequest: async (requestId, status, remarks) => {
        return await approvalService.reviewUploadRequest(requestId, status, remarks);
    },

    /**
     * ADMIN: Review a book upload.
     */
    reviewUploadRequest: async (requestId, status, remarks = "") => {
        try {
            const response = await apiClient.put(`${BASE_URL}/upload/${requestId}/review`, {
                status,
                remarks
            });
            return response.data;
        } catch (error) {
            console.error("Error reviewing upload request:", error);
            throw error.response?.data || error;
        }
    },

    // ============================================================
    // 📘 BOOK ACCESS REQUESTS (User <-> Admin)
    // ============================================================

    submitAccessRequest: async (requestData) => {
        try {
            const response = await apiClient.post(`${BASE_URL}/access`, requestData);
            return response.data;
        } catch (error) {
            console.error("Error submitting access request:", error);
            throw error.response?.data || error;
        }
    },

    getMyAccessRequests: async () => {
        try {
            const response = await apiClient.get(`${BASE_URL}/access/my-requests`);
            return response.data;
        } catch (error) {
            console.error("Error fetching my requests:", error);
            throw error.response?.data || error;
        }
    },

    getAllAccessRequests: async (params = {}) => {
        try {
            const response = await apiClient.get(`${BASE_URL}/access/all`, { params });
            return response.data;
        } catch (error) {
            console.error("Error fetching all requests:", error);
            throw error.response?.data || error;
        }
    },

    reviewAccessRequest: async (requestId, updateData) => {
        try {
            const response = await apiClient.put(`${BASE_URL}/access/${requestId}/review`, updateData);
            return response.data;
        } catch (error) {
            console.error("Error reviewing request:", error);
            throw error.response?.data || error;
        }
    }
};