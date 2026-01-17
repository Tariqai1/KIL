// src/api/approvalService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const approvalService = {
    /**
     * USER ENDPOINT: Nayi access request submit karein
     * @param {Object} requestData - { book_id, request_reason, contact_number, delivery_address, requested_days }
     */
    submitRequest: async (requestData) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/requests/access`, requestData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    /**
     * USER ENDPOINT: User ki apni bheji hui requests fetch karein
     */
    getMyRequests: async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/requests/access/my-requests`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    /**
     * ADMIN ENDPOINT: Saari pending requests fetch karein
     */
    getAllRequests: async (status = null) => {
        const token = localStorage.getItem('token');
        const url = status ? `${API_URL}/requests/?status=${status}` : `${API_URL}/requests/`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    /**
     * ADMIN ENDPOINT: Request ko approve ya reject karein
     * @param {number} requestId 
     * @param {Object} updateData - { status: 'Approved' | 'Rejected', rejection_reason: string }
     */
    reviewRequest: async (requestId, updateData) => {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_URL}/requests/access/${requestId}/review`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};