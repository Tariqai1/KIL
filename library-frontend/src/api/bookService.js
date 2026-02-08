import apiClient from './apiClient';

export const bookService = {

    // ============================================================
    // 1. BOOK MANAGEMENT
    // ============================================================

    /**
     * Fetches all books.
     * Supports both Public (isApproved=true) and Admin (queryParams object).
     */
    async getAllBooks(queryParams = {}) {
        try {
            let configParams = queryParams;

            // ✅ FIX: Agar koi sirf 'true' bhej raha hai, to usse object bana do
            // Taake Admin panel ka filter bhi chale aur Public side bhi crash na ho.
            if (queryParams === true) {
                configParams = { is_approved: true };
            }

            const response = await apiClient.get('/api/books?approved_only=true', { 
                params: configParams 
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching books:", error);
            throw error;
        }
    },

    async getBookById(bookId) {
        try {
            const response = await apiClient.get(`/api/books/${bookId}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching book ${bookId}:`, error);
            throw error;
        }
    },

    async createBook(formData) {
        try {
            const response = await apiClient.post('/api/books/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error) {
            console.error("Error creating book:", error.response?.data);
            throw error;
        }
    },

    async updateBook(bookId, formData) {
        try {
            const response = await apiClient.put(`/api/books/${bookId}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating book ${bookId}:`, error.response?.data);
            throw error;
        }
    },

    async deleteBook(bookId) {
        try {
            const response = await apiClient.delete(`/api/books/${bookId}/`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting book ${bookId}:`, error);
            throw error;
        }
    },

    // ============================================================
    // 2. METADATA & LISTS
    // ============================================================

    async getAllLanguages() {
        try {
            const response = await apiClient.get('/api/languages/');
            return response.data;
        } catch (error) {
            return [];
        }
    },

    async getAllSubcategories() {
        try {
            const response = await apiClient.get('/api/subcategories/');
            return response.data;
        } catch (error) {
            return [];
        }
    },

    // ============================================================
    // 3. REQUESTS & AUTHENTICATION SAFEGUARDS
    // ============================================================

    async createApprovalRequest(bookId) {
        try {
            const response = await apiClient.post('/api/requests/upload/', { book_id: bookId });
            return response.data;
        } catch (error) {
            console.error("Error creating approval request:", error.response?.data);
            return null; 
        }
    },

    async sendBookRequest(requestData) {
        try {
            const response = await apiClient.post('/api/requests/access/', requestData);
            return response.data;
        } catch (error) {
            console.error("Book Request Failed:", error.response?.data);
            throw error;
        }
    },

    // ✅ FIX: 401 Unauthorized Error rokne ke liye
    async getMyRequests() {
        try {
            // Check if token exists before calling API
            const token = localStorage.getItem('access_token'); // Ya jo bhi aap key use kar rahe hain
            
            if (!token) {
                // Agar user login nahi hai, to API call mat karo, empty list wapas kardo
                return [];
            }

            const response = await apiClient.get('/api/requests/access/my-requests/');
            return response.data;
        } catch (error) {
            // Agar 401 aye to console me shor na machaye, bas empty array de de
            if (error.response && error.response.status === 401) {
                return [];
            }
            console.error("Error fetching my requests:", error);
            return [];
        }
    }
};