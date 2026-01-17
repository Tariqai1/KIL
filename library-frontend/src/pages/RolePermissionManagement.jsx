// src/pages/RolePermissionManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { rolePermissionService } from '../api/rolePermissionService';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, TrashIcon, ShieldCheckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'; // Updated import path for v2
import '../assets/css/ManagementPages.css';

// --- Helper: Parse Backend Errors (Prevents React Crashes) ---
const parseErrorMessage = (err) => {
    if (!err) return 'An unexpected error occurred.';
    if (typeof err === 'string') return err;
    
    // Handle Pydantic Validation Errors (Array of objects)
    if (err.detail && Array.isArray(err.detail)) {
        return err.detail.map(e => e.msg).join(', ');
    }
    
    // Handle Standard HTTP Errors
    if (err.detail) return err.detail;
    if (err.message) return err.message;
    
    return 'An unknown error occurred.';
};

// --- Spinner Component ---
const SpinnerIcon = ({ className = "text-white" }) => (
    <svg className={`animate-spin -ml-1 mr-2 h-4 w-4 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
};

const RolePermissionManagement = () => {
    // --- State ---
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isLoadingPerms, setIsLoadingPerms] = useState(true);
    
    // Feedback State
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    
    // Role CRUD State
    const [roleName, setRoleName] = useState('');
    const [isSubmittingRole, setIsSubmittingRole] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    // Permission Editing State
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [currentRolePermissions, setCurrentRolePermissions] = useState(new Set());
    const [isLoadingRolePerms, setIsLoadingRolePerms] = useState(false);
    const [isSavingPerms, setIsSavingPerms] = useState(false);

    // --- Data Fetching ---
    const loadData = useCallback(async () => {
        setIsLoadingRoles(true);
        setIsLoadingPerms(true);
        setErrorMsg(null);
        try {
            const [rolesData, permsData] = await Promise.all([
                rolePermissionService.getAllRoles(),
                rolePermissionService.getAllPermissions()
            ]);
            setRoles(rolesData || []);
            setAllPermissions(permsData || []);
        } catch (err) {
            console.error("Load Data Error:", err);
            setErrorMsg(parseErrorMessage(err));
        } finally {
            setIsLoadingRoles(false);
            setIsLoadingPerms(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- Helpers ---
    const clearMessages = () => {
        setErrorMsg(null);
        setSuccessMsg(null);
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 4000); // Auto hide after 4s
    };

    // --- Role CRUD Handlers ---
    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        if (!roleName.trim()) {
            setErrorMsg('Role name cannot be empty.');
            return;
        }
        clearMessages();
        setIsSubmittingRole(true);

        try {
            if (editingRole) {
                await rolePermissionService.updateRole(editingRole.id, { name: roleName });
                showSuccess(`Role "${roleName}" updated successfully.`);
            } else {
                await rolePermissionService.createRole({ name: roleName });
                showSuccess(`Role "${roleName}" created successfully.`);
            }
            setEditingRole(null);
            setRoleName('');
            
            // Refresh Roles only
            const updatedRoles = await rolePermissionService.getAllRoles();
            setRoles(updatedRoles);
        } catch (err) {
            setErrorMsg(parseErrorMessage(err));
        } finally {
            setIsSubmittingRole(false);
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (!window.confirm('Are you sure? This will remove this role from all associated users.')) return;
        
        clearMessages();
        try {
            await rolePermissionService.deleteRole(roleId);
            showSuccess('Role deleted successfully.');
            
            // UI Cleanup
            setRoles(prev => prev.filter(r => r.id !== roleId));
            if (selectedRoleId == roleId) {
                setSelectedRoleId('');
                setCurrentRolePermissions(new Set());
            }
        } catch (err) {
            setErrorMsg(parseErrorMessage(err));
        }
    };

    const handleEditRoleClick = (role) => {
        setEditingRole(role);
        setRoleName(role.name);
        clearMessages();
    };

    // --- Permission Management Handlers ---
    const handleRoleSelectChange = async (e) => {
        const roleId = e.target.value;
        setSelectedRoleId(roleId);
        setCurrentRolePermissions(new Set());
        clearMessages();
        
        if (!roleId) return;

        setIsLoadingRolePerms(true);
        try {
            const roleDetails = await rolePermissionService.getRoleDetails(roleId);
            // Assuming roleDetails.permissions is an array of objects {id, name...}
            const ids = (roleDetails.permissions || []).map(p => p.id);
            setCurrentRolePermissions(new Set(ids));
        } catch (err) {
            setErrorMsg(parseErrorMessage(err));
        } finally {
            setIsLoadingRolePerms(false);
        }
    };

    const handlePermissionToggle = (permId) => {
        clearMessages(); // Clear old errors when user interacts
        setCurrentRolePermissions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(permId)) newSet.delete(permId);
            else newSet.add(permId);
            return newSet;
        });
    };

    const handleSavePermissions = async () => {
        clearMessages();
        const permissionIds = Array.from(currentRolePermissions);

        // --- VALIDATION: Backend requires at least 1 item ---
        if (permissionIds.length === 0) {
            setErrorMsg("Validation Error: Please select at least one permission for this role.");
            return;
        }

        setIsSavingPerms(true);
        try {
            // Sending payload format: { "permission_ids": [1, 2, 3] }
            await rolePermissionService.updatePermissionsForRole(selectedRoleId, { permission_ids: permissionIds });
            showSuccess("Permissions saved successfully!");
        } catch (err) {
            console.error("Save Permissions Error:", err);
            setErrorMsg(parseErrorMessage(err));
        } finally {
            setIsSavingPerms(false);
        }
    };

    // --- Render ---
    return (
        <div className="management-container p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">🔐 Role & Permission Management</h1>

            {/* --- Global Alerts --- */}
            <AnimatePresence>
                {errorMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center shadow-sm">
                        <XCircleIcon className="h-5 w-5 mr-2" />
                        {errorMsg}
                    </motion.div>
                )}
                {successMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-md bg-green-50 border border-green-200 text-green-700 flex items-center shadow-sm">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* --- LEFT COLUMN: Manage Roles --- */}
                <motion.div layout className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                    <div className="p-5 border-b border-gray-100 bg-gray-50">
                        <h2 className="text-xl font-semibold text-gray-800">1. Manage Roles</h2>
                        <p className="text-sm text-gray-500">Create new roles or edit existing ones.</p>
                    </div>
                    
                    <div className="p-5 space-y-6 flex-grow">
                        {/* Add/Edit Form */}
                        <form onSubmit={handleRoleSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                placeholder="Enter Role Name (e.g. Editor)"
                                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isSubmittingRole}
                            />
                            {editingRole && (
                                <button
                                    type="button"
                                    onClick={() => { setEditingRole(null); setRoleName(''); }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmittingRole || !roleName.trim()}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            >
                                {isSubmittingRole ? <SpinnerIcon /> : (editingRole ? 'Update' : 'Add')}
                            </button>
                        </form>

                        {/* Role List */}
                        <div className="border rounded-md overflow-hidden">
                            {isLoadingRoles ? (
                                <div className="p-8 text-center text-gray-500">Loading roles...</div>
                            ) : roles.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No roles defined.</div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {roles.map(role => (
                                            <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-500">#{role.id}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{role.name}</td>
                                                <td className="px-4 py-3 text-right space-x-2">
                                                    <button onClick={() => handleEditRoleClick(role)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50" title="Edit">
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteRole(role.id)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Delete">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* --- RIGHT COLUMN: Assign Permissions --- */}
                <motion.div layout className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                    <div className="p-5 border-b border-gray-100 bg-gray-50">
                        <h2 className="text-xl font-semibold text-gray-800">2. Assign Permissions</h2>
                        <p className="text-sm text-gray-500">Select a role and toggle access rights.</p>
                    </div>

                    <div className="p-5 flex-grow flex flex-col">
                        {/* Role Selector */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Role to Edit</label>
                            <select
                                value={selectedRoleId}
                                onChange={handleRoleSelectChange}
                                className="block w-full p-2.5 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isLoadingRoles}
                            >
                                <option value="">-- Choose a Role --</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Permissions Content */}
                        <div className="flex-grow border rounded-md p-4 bg-gray-50 min-h-[300px]">
                            {!selectedRoleId ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <ShieldCheckIcon className="h-12 w-12 mb-2 opacity-20" />
                                    <p>Select a role above to view permissions</p>
                                </div>
                            ) : (isLoadingRolePerms || isLoadingPerms) ? (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    <SpinnerIcon className="text-indigo-600 h-6 w-6" />
                                    <span className="ml-2">Loading permissions...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {allPermissions.map(perm => (
                                        <label 
                                            key={perm.id} 
                                            className={`flex items-start p-3 rounded-md border cursor-pointer transition-all ${
                                                currentRolePermissions.has(perm.id) 
                                                ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                                                : 'bg-white border-gray-200 hover:border-indigo-200'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                checked={currentRolePermissions.has(perm.id)}
                                                onChange={() => handlePermissionToggle(perm.id)}
                                            />
                                            <div className="ml-3">
                                                <span className={`block text-sm font-medium ${currentRolePermissions.has(perm.id) ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                    {perm.name}
                                                </span>
                                                <span className="block text-xs text-gray-500 mt-0.5">{perm.codename}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSavePermissions}
                                disabled={!selectedRoleId || isSavingPerms || isLoadingRolePerms}
                                className="px-6 py-2.5 bg-green-600 text-white rounded-md font-medium shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all"
                            >
                                {isSavingPerms ? <SpinnerIcon /> : <CheckCircleIcon className="h-5 w-5 mr-2" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default RolePermissionManagement;