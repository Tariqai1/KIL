import apiClient from './apiClient';

export const bookService = {

    // ============================================================
    // 1. BOOK MANAGEMENT (Public & Admin)
    // ============================================================

    /**
     * Fetches all books.
     * @param {Object} queryParams - Defaults to approved_only: true
     */
    async getAllBooks(queryParams = { approved_only: true }) {
        try {
            // FIX: params ko ek object wrapper { params: queryParams } mein bhejhein
            // Isse "target must be an object" ka error khatam ho jayega
            const response = await apiClient.get('/api/books/', { 
                params: queryParams 
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching books:", error);
            throw error;
        }
    },

    /**
     * Fetches a single book by ID.
     */
    async getBookById(bookId) {
        try {
            const response = await apiClient.get(`/api/books/${bookId}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching book ${bookId}:`, error);
            throw error;
        }
    },
    

    /**
     * Create a new book (FormData support for Image/PDF).
     */
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

    /**
     * Update an existing book.
     */
    async updateBook(bookId, formData) {
        try {
            const response = await apiClient.put(`/api/books/${bookId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating book ${bookId}:`, error.response?.data);
            throw error;
        }
    },
    // Kisi specific book ki request status check karne ke liye
checkAccessStatus: async (bookId, whatsapp) => {
    const response = await axios.get(`http://127.0.0.1:8000/api/restricted-requests/check?book_id=${bookId}&whatsapp=${whatsapp}`);
    return response.data; // Yeh status 'pending', 'approved', ya 'rejected' dega
},

    /**
     * Delete a book.
     */
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
    // 2. METADATA (Languages & Categories)
    // ============================================================

    async getAllLanguages() {
        try {
            const response = await apiClient.get('/api/languages/');
            return response.data;
        } catch (error) {
            console.error("Error fetching languages:", error);
            return [];
        }
    },

    async getAllSubcategories() {
        try {
            const response = await apiClient.get('/api/subcategories/');
            return response.data;
        } catch (error) {
            console.error("Error fetching subcategories:", error);
            return [];
        }
    },

    // ============================================================
    // 3. REQUESTS & ACCESS WORKFLOW
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

    async getMyRequests() {
        try {
            const response = await apiClient.get('/api/requests/access/my-requests/');
            return response.data;
        } catch (error) {
            console.error("Error fetching my requests:", error);
            return [];
        }
    }
};