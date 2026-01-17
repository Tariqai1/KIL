// src/api/rolePermissionService.js
import apiClient from './apiClient';

/**
 * Service for managing Roles and Permissions.
 * Note: Endpoints are specific to the backend structure (e.g., /api/users/roles/).
 */
export const rolePermissionService = {

    // --- Role CRUD ---

    /** * Fetch all roles 
     * API: GET /api/users/roles/ 
     */
    async getAllRoles() {
        try {
            const response = await apiClient.get('/api/users/roles/');
            return response.data;
        } catch (error) {
            console.error('Error fetching roles:', error.response?.data);
            throw error.response?.data || { detail: 'Failed to fetch roles' };
        }
    },

    /** * Fetch role details 
     * API: GET /api/users/roles/{id}/ 
     */
    async getRoleDetails(roleId) {
        try {
            const response = await apiClient.get(`/api/users/roles/${roleId}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching role ${roleId}:`, error.response?.data);
            throw error.response?.data || { detail: 'Failed to fetch role details' };
        }
    },

    /** * Create a new role 
     * API: POST /api/users/roles/ 
     */
    async createRole(roleData) {
        try {
            const response = await apiClient.post('/api/users/roles/', roleData);
            return response.data;
        } catch (error) {
            console.error('Error creating role:', error.response?.data);
            throw error.response?.data || { detail: 'Failed to create role' };
        }
    },

    /** * Update an existing role 
     * API: PUT /api/users/roles/{id}/ 
     */
    async updateRole(roleId, roleData) {
        try {
            const response = await apiClient.put(`/api/users/roles/${roleId}/`, roleData);
            return response.data;
        } catch (error) {
            console.error(`Error updating role ${roleId}:`, error.response?.data);
            throw error.response?.data || { detail: 'Failed to update role' };
        }
    },

    /** * Delete a role 
     * API: DELETE /api/users/roles/{id}/ 
     */
    async deleteRole(roleId) {
        try {
            const response = await apiClient.delete(`/api/users/roles/${roleId}/`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting role ${roleId}:`, error.response?.data);
            throw error.response?.data || { detail: 'Failed to delete role' };
        }
    },

    // --- Permission Management ---

    /** * Fetch all available permissions 
     * API: GET /api/permissions/permissions/ 
     */
    async getAllPermissions() {
        try {
            const response = await apiClient.get('/api/permissions/permissions/');
            return response.data;
        } catch (error) {
            console.error('Error fetching permissions:', error.response?.data);
            throw error.response?.data || { detail: 'Failed to fetch permissions' };
        }
    },

    /**
     * Assign permissions to a role
     * API: POST /api/permissions/roles/{id}/permissions
     * Payload: { permission_ids: [1, 2, 3] }
     */
    async updatePermissionsForRole(roleId, permissionIdsObject) {
        try {
            // Backend expects POST for assignment
            const response = await apiClient.post(`/api/permissions/roles/${roleId}/permissions`, permissionIdsObject);
            return response.data;
        } catch (error) {
            console.error('Error updating permissions:', error.response?.data);
            throw error.response?.data || { detail: 'Failed to update permissions' };
        }
    }
};