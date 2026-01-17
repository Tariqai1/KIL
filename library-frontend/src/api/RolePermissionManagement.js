// src/api/rolePermissionService.js
import apiClient from './apiClient'; // Using default import

export const rolePermissionService = {

    // --- Role CRUD ---

    /**
     * Sabhi roles ko fetch karta hai
     * API Endpoint: GET /api/roles/
     */
    async getAllRoles() {
        try {
            const response = await apiClient.get('/api/roles/');
            return response.data;
        } catch (error) {
            console.error('Error fetching roles:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    },
    
    /**
     * Ek specific role ki details (permissions ke saath) fetch karta hai
     * API Endpoint: GET /api/roles/{id}/
     */
    async getRoleDetails(roleId) {
        try {
            // Assume this endpoint returns { id, name, permissions: [...] }
            const response = await apiClient.get(`/api/roles/${roleId}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching role details:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    },

    /**
     * Ek naya role banata hai
     * API Endpoint: POST /api/roles/
     */
    async createRole(roleData) { // roleData = { name: 'New Role' }
        try {
            const response = await apiClient.post('/api/roles/', roleData);
            return response.data;
        } catch (error) {
            console.error('Error creating role:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    },

    /**
     * Ek existing role ko update karta hai (sirf naam)
     * API Endpoint: PUT /api/roles/{id}/
     */
    async updateRole(roleId, roleData) { // roleData = { name: 'Updated Name' }
        try {
            const response = await apiClient.put(`/api/roles/${roleId}/`, roleData);
            return response.data;
        } catch (error) {
            console.error('Error updating role:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    },

    /**
     * Ek role ko delete karta hai
     * API Endpoint: DELETE /api/roles/{id}/
     */
    async deleteRole(roleId) {
        try {
            const response = await apiClient.delete(`/api/roles/${roleId}/`);
            return response.data;
        } catch (error) {
            console.error('Error deleting role:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    },

    // --- Permission Management ---

    /**
     * Sabhi available permissions ko fetch karta hai
     * API Endpoint: GET /api/permissions/
     */
    async getAllPermissions() {
        try {
            const response = await apiClient.get('/api/permissions/');
            return response.data;
        } catch (error) {
            console.error('Error fetching all permissions:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    },

    /**
     * Ek role ke permissions ko update/set karta hai
     * API Endpoint: PUT /api/roles/{id}/permissions/
     */
    async updatePermissionsForRole(roleId, permissionIdsObject) { 
        // permissionIdsObject = { permission_ids: [1, 2, 5] }
        try {
            // This endpoint might be different for you (e.g., POST or PATCH)
            const response = await apiClient.put(`/api/roles/${roleId}/permissions/`, permissionIdsObject);
            return response.data;
        } catch (error) {
            console.error('Error updating permissions:', error.response?.data);
            throw error.response?.data || { detail: 'Network error' };
        }
    }
};