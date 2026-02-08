// src/components/user/UserForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../../api/userService';

// Spinner Icon
const SpinnerIcon = ({ className = "text-white" }) => (
    <svg className={`animate-spin -ml-0.5 mr-2 h-4 w-4 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const UserForm = ({ 
    onSubmitSuccess, 
    onError,        
    onCancel,       
    initialData = null, 
    isEditing = false, 
    roles = [] 
}) => {

    // --- Safety Checks ---
    const safeOnError = onError || ((msg) => console.error("Error:", msg));
    const safeOnSuccess = onSubmitSuccess || (() => console.log("Success"));

    // --- State ---
    const getInitialState = useCallback(() => ({
        username: initialData?.username || '',
        email: initialData?.email || '',
        full_name: initialData?.full_name || initialData?.fullName || '', 
        password: '', 
        role_id: initialData?.role?.id || initialData?.role_id || '', 
        status: initialData?.status || 'Active', 
    }), [initialData]);

    const [formData, setFormData] = useState(getInitialState());
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        setFormData(getInitialState());
        setPasswordConfirm('');
    }, [initialData, getInitialState]);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        if (onError) onError(null); 
        
        // --- Validation ---
        if (!formData.username || !formData.email || !formData.role_id) {
            safeOnError("Username, Email, and Role are required.");
            setIsLoading(false);
            return;
        }

        // Password Validation
        if (!isEditing) { 
            // Create Mode: Password is Mandatory
            if (!formData.password || formData.password.length < 8) {
                safeOnError("Password is required and must be at least 8 characters.");
                setIsLoading(false);
                return;
            }
            if (formData.password !== passwordConfirm) {
                safeOnError("Passwords do not match.");
                setIsLoading(false);
                return;
            }
        } else { 
            // Edit Mode: Password is Optional, but if provided, must match rules
             if (formData.password) {
                if (formData.password.length < 8) {
                    safeOnError("New password must be at least 8 characters.");
                    setIsLoading(false);
                    return;
                }
                if (formData.password !== passwordConfirm) {
                    safeOnError("Passwords do not match.");
                    setIsLoading(false);
                    return;
                }
             }
        }

        // --- API Call ---
        try {
            if (isEditing) {
                // ✅ Update Logic
                const payload = {
                    username: formData.username, // Allow username updates if backend permits
                    email: formData.email,       // Allow email updates
                    full_name: formData.full_name,
                    role_id: parseInt(formData.role_id, 10),
                    status: formData.status,
                };
                
                // Only include password if user typed one
                if (formData.password) {
                     payload.password = formData.password;
                }

                console.log("Updating User:", payload); // Debugging
                const updatedUser = await userService.updateUser(initialData.id, payload);
                safeOnSuccess(updatedUser); 

            } else {
                // ✅ Create Logic
                const payload = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name || null,
                    role_id: parseInt(formData.role_id, 10),
                };
                console.log("Creating User:", payload); // Debugging
                const newUser = await userService.createUser(payload);
                safeOnSuccess(newUser); 
            }
        } catch (err) {
            console.error("UserForm submit error:", err);
            // Show the exact error message from backend (e.g. "Email already registered")
            const errorMsg = err.detail || err.message || "An unexpected error occurred.";
            safeOnError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Tailwind Classes ---
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:bg-gray-100";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const buttonClass = `inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`;
    const primaryButtonClass = `${buttonClass} bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;
    const secondaryButtonClass = `${buttonClass} bg-white hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-indigo-500`;

    return (
        <form onSubmit={handleSubmit} className="space-y-4"> 
            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                
                {/* Username */}
                <div className="sm:col-span-1">
                    <label htmlFor="username" className={labelClass}>Username *</label>
                    <input 
                        type="text" id="username" name="username" 
                        value={formData.username} onChange={handleChange} 
                        required disabled={isLoading} // Enabled in edit mode too now
                        className={inputClass} 
                        autoComplete="username" 
                    />
                </div>

                {/* Email */}
                <div className="sm:col-span-1">
                    <label htmlFor="email" className={labelClass}>Email *</label>
                    <input 
                        type="email" id="email" name="email" 
                        value={formData.email} onChange={handleChange} 
                        required disabled={isLoading} // Enabled in edit mode too now
                        className={inputClass} 
                        autoComplete="email" 
                    />
                </div>

                {/* Full Name */}
                <div className="sm:col-span-2">
                    <label htmlFor="full_name" className={labelClass}>Full Name</label>
                    <input 
                        type="text" id="full_name" name="full_name" 
                        value={formData.full_name} onChange={handleChange} 
                        disabled={isLoading} className={inputClass} autoComplete="name" 
                    />
                </div>
                
                {/* Password Fields (Conditional Logic) */}
                <div className="sm:col-span-1">
                    <label htmlFor="password" className={labelClass}>
                        {isEditing ? "New Password (Optional)" : "Password *"}
                    </label>
                    <input 
                        type="password" id="password" name="password" 
                        value={formData.password} onChange={handleChange} 
                        required={!isEditing} disabled={isLoading} 
                        className={inputClass} autoComplete="new-password" 
                        placeholder={isEditing ? "Leave blank to keep current" : ""}
                    />
                </div>
                
                {/* Confirm Password (Only show if creating OR if typing a new password) */}
                {(!isEditing || formData.password) && (
                    <div className="sm:col-span-1">
                        <label htmlFor="passwordConfirm" className={labelClass}>
                            Confirm Password  hahdsdhskhd*
                        </label>
                        <input 
                            type="password" id="passwordConfirm" name="passwordConfirm" 
                            value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} 
                            required disabled={isLoading} 
                            className={inputClass} autoComplete="new-password" 
                        />
                    </div>
                )}
                
                {/* Role Selection */}
                <div className="sm:col-span-1">
                    <label htmlFor="role_id" className={labelClass}>Role *</label>
                    <select 
                        id="role_id" name="role_id" 
                        value={formData.role_id} onChange={handleChange} 
                        required disabled={isLoading} className={inputClass}
                    >
                        <option value="">Select Role</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                </div>
                 
                {/* Status Selection (Only in Edit Mode) */}
                {isEditing && (
                    <div className="sm:col-span-1">
                        <label htmlFor="status" className={labelClass}>Status *</label>
                        <select 
                            id="status" name="status" 
                            value={formData.status} onChange={handleChange} 
                            required disabled={isLoading} className={inputClass}
                        >
                             <option value="Active">Active</option>
                             <option value="Inactive">Inactive</option>
                             <option value="Suspended">Suspended</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200 mt-4">
                <button 
                    type="button" 
                    className={secondaryButtonClass} 
                    onClick={onCancel} 
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className={primaryButtonClass} 
                    disabled={isLoading}
                >
                    {isLoading ? <SpinnerIcon /> : null}
                    {isLoading ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
                </button>
            </div>
        </form>
    );
};

export default UserForm;