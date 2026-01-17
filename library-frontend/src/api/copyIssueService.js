// src/api/copyIssueService.js
import apiClient from './apiClient';

// --- Book Copy Endpoints ---

/**
 * Fetches all book copies.
 * @returns {Promise<Array>} List of book copy objects (includes nested book and location).
 */
const getAllCopies = async () => {
    try {
        const response = await apiClient.get('/api/copies/');
        return response.data;
    } catch (error) {
        console.error("Error fetching book copies:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch book copies');
    }
};

/**
 * Creates a new book copy.
 * @param {object} copyData - { book_id: number, location_id: number }.
 * @returns {Promise<object>} The newly created book copy object.
 */
const createCopy = async (copyData) => {
    try {
        const response = await apiClient.post('/api/copies/', copyData);
        return response.data;
    } catch (error) {
        console.error("Error creating book copy:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create book copy');
    }
};

// --- Issuing/Returning Endpoints ---

/**
 * Fetches all issue records.
 * @returns {Promise<Array>} List of issue records (includes nested user, copy, book).
 */
const getAllIssues = async () => {
    try {
        const response = await apiClient.get('/api/issues/');
        return response.data;
    } catch (error) {
        console.error("Error fetching issue records:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch issue records');
    }
};

/**
 * Issues a specific book copy to a client.
 * @param {object} issueData - { copy_id: number, client_id: number, due_date: string (YYYY-MM-DD format recommended) }.
 * @returns {Promise<object>} The newly created issue record.
 */
const issueBook = async (issueData) => {
    try {
        // Backend expects date string, ensure it's formatted correctly if needed
        const response = await apiClient.post('/api/issues/issue', issueData);
        return response.data;
    } catch (error) {
        console.error("Error issuing book:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to issue book');
    }
};

/**
 * Marks an issued book as returned.
 * @param {number} issueId - The ID of the issue record to mark as returned.
 * @returns {Promise<object>} The updated issue record.
 */
const returnBook = async (issueId) => {
    try {
        // The endpoint expects the ID in the URL, no payload needed
        const response = await apiClient.post(`/api/issues/return/${issueId}`);
        return response.data;
    } catch (error) {
        console.error(`Error returning book for issue ${issueId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to return book');
    }
};

// Ensure correct named export
export const copyIssueService = {
    getAllCopies,
    createCopy,
    getAllIssues,
    issueBook,
    returnBook,
};