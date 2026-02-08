import apiClient from './apiClient';

/**
 * Service for managing Roles and Permissions.
 * Fully optimized to match the Python Backend endpoints.
 */
export const rolePermissionService = {

    // ==========================================
    // 1. Role Fetching (Fixes 404 Error)
    // ==========================================

    /**
     * Fetch all roles.
     * Backend Path: GET /api/permissions/roles
     */
    async getAllRoles() {
        try {
            // ✅ Note: No trailing slash at the end
            const response = await apiClient.get('/api/permissions/roles');
            return response.data;
        } catch (error) {
            console.error('Fetch Roles Error:', error.response?.data);
            throw error.response?.data || { detail: 'Roles fetch nahi ho sake.' };
        }
    },

    /**
     * Fetch details of a single role.
     * Backend Path: GET /api/permissions/roles/{id}
     */
    async getRoleDetails(roleId) {
        try {
            const response = await apiClient.get(`/api/permissions/roles/${roleId}`);
            return response.data;
        } catch (error) {
            console.error(`Fetch Role ${roleId} Error:`, error.response?.data);
            throw error.response?.data || { detail: 'Role details nahi mili.' };
        }
    },

    // ==========================================
    // 2. Permission Fetching
    // ==========================================

    /**
     * Fetch all available permissions.
     * Backend Path: GET /api/permissions/permissions
     */
    async getAllPermissions() {
        try {
            // ✅ Matches @router.get("/permissions") inside /api/permissions prefix
            const response = await apiClient.get('/api/permissions/permissions');
            return response.data;
        } catch (error) {
            console.error('Fetch Permissions Error:', error.response?.data);
            throw error.response?.data || { detail: 'Permissions load nahi huin.' };
        }
    },

    // ==========================================
    // 3. Permission Assignment
    // ==========================================

    /**
     * Assign permissions to a role.
     * Backend Path: POST /api/permissions/roles/{id}/permissions
     */
   // src/api/rolePermissionService.js

// src/api/rolePermissionService.js

async updatePermissionsForRole(roleId, permissionIds) {
    try {
        // ✅ اہم ترین تبدیلی: ڈیٹا کو اس فارمیٹ میں پیک کریں
        const payload = {
            permission_ids: Array.from(permissionIds) 
        };
        
        console.log("Sending Payload:", payload); // چیک کرنے کے لیے
        
        const response = await apiClient.post(`/api/permissions/roles/${roleId}/permissions`, payload);
        return response.data;
    } catch (error) {
        console.error('Update Permissions Error:', error.response?.data);
        throw error.response?.data || { detail: 'Mapping failed' };
    }
},
    // ==========================================
    // 4. Role CRUD (Create/Update/Delete)
    // ==========================================
    
    // Note: Agar aapne Backend mein Create/Update/Delete ke endpoints abhi nahi banaye, 
    // to ye neeche wale functions 405 Method Not Allowed de sakte hain.
    // Filhal hum 'Fetching' fix kar rahe hain.

    async createRole(roleData) {
        try {
            const response = await apiClient.post('/api/permissions/roles', roleData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { detail: 'Role create nahi hua.' };
        }
    },

    async updateRole(roleId, roleData) {
        try {
            const response = await apiClient.put(`/api/permissions/roles/${roleId}`, roleData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { detail: 'Role update nahi hua.' };
        }
    },

    async deleteRole(roleId) {
        try {
            const response = await apiClient.delete(`/api/permissions/roles/${roleId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { detail: 'Role delete nahi hua.' };
        }
    }
};