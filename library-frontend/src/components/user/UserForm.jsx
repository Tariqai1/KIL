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

// Form component
const UserForm = ({ 
    onSubmitSuccess, // Parent se (UserManagement)
    onError,         // Parent se
    onCancel,        // Parent se
    initialData = null, 
    isEditing = false, 
    roles = [] 
}) => {

    // --- State ---
    const getInitialState = useCallback(() => ({
        username: initialData?.username || '',
        email: initialData?.email || '',
        full_name: initialData?.full_name || initialData?.fullName || '', // Dono naam handle karein
        password: '', // Password hamesha khali rakhein
        role_id: initialData?.role?.id || '', // Nested role ID
        status: initialData?.status || 'Active', // Default status
    }), [initialData]);

    const [formData, setFormData] = useState(getInitialState());
    const [passwordConfirm, setPasswordConfirm] = useState(''); // Password confirmation ke liye
    const [isLoading, setIsLoading] = useState(false);
    
    // Form reset karein jab initialData badle (Edit se Add mode switch)
    useEffect(() => {
        setFormData(getInitialState());
        setPasswordConfirm('');
    }, [initialData, getInitialState]);

    // --- Handlers (FIXED) ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Form ko page reload karne se rokein
        setIsLoading(true);
        onError(null); // Purana error clear karein
        
        // --- Frontend Validation ---
        if (!formData.username || !formData.email || !formData.role_id) {
            onError("Username, Email, and Role are required.");
            setIsLoading(false);
            return;
        }
        if (!isEditing) { // Naya user banate waqt
            if (!formData.password || formData.password.length < 8) {
                onError("Password is required and must be at least 8 characters.");
                setIsLoading(false);
                return;
            }
            if (formData.password !== passwordConfirm) {
                onError("Passwords do not match.");
                setIsLoading(false);
                return;
            }
        } else { // User edit karte waqt
             if (formData.password && formData.password.length < 8) {
                onError("New password must be at least 8 characters.");
                setIsLoading(false);
                return;
             }
        }

        // --- API Call ---
        try {
            if (isEditing) {
                // --- UPDATE USER ---
                // Backend 'UserUpdate' schema ke hisaab se payload banayein
                const payload = {
                    full_name: formData.full_name,
                    role_id: parseInt(formData.role_id, 10),
                    status: formData.status,
                };
                // Password tabhi bhejein agar user ne naya password type kiya hai
                if (formData.password) {
                    // Note: Backend ko 'password' update handle karna hoga
                    // Aam taur par, 'password' UserUpdate schema mein nahi hota
                    // Lekin agar hai, toh yeh kaam karega.
                    console.warn("Attempting to update password via main update endpoint.");
                    // payload.password = formData.password; // Yeh line hatayein agar password update alag endpoint se hota hai
                }
                const updatedUser = await userService.updateUser(initialData.id, payload);
                onSubmitSuccess(updatedUser); // Parent ko success batayein
            } else {
                // --- CREATE USER ---
                // Backend 'UserCreate' schema ke hisaab se payload banayein
                const payload = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name || null, // Khaali string ki jagah null bhejein
                    role_id: parseInt(formData.role_id, 10),
                };
                const newUser = await userService.createUser(payload);
                onSubmitSuccess(newUser); // Parent ko success batayein
            }
        } catch (err) {
            console.error("UserForm submit error:", err);
            // Parent (UserManagement) ko error message pass karein
            onError(err.detail || "An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    // --- END FIX ---

    // --- Tailwind Classes ---
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const buttonClass = `inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`;
    const primaryButtonClass = `${buttonClass} bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;
    const secondaryButtonClass = `${buttonClass} bg-white hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-indigo-500`;


    return (
        // `space-y-4` form fields ke beech vertical space add karta hai
        <form onSubmit={handleSubmit} className="space-y-4"> 
            
            {/* Error/Success messages ab Modal mein (parent component) handle ho rahe hain,
              kyunki 'onError' prop ka istemaal kiya ja raha hai.
              Aap chahein toh yahaan bhi `error` state bana kar use kar sakte hain.
            */}

            {/* Grid layout (2 columns) */}
            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
                    <label htmlFor="username" className={labelClass}>Username *</label>
                    <input 
                        type="text" id="username" name="username" 
                        value={formData.username} onChange={handleChange} 
                        required disabled={isLoading || isEditing} // Username edit karna disable karein
                        className={inputClass + (isEditing ? " bg-gray-100" : "")} // Editing mein grey background
                        autoComplete="username" 
                    />
                </div>
                <div className="sm:col-span-1">
                    <label htmlFor="email" className={labelClass}>Email *</label>
                    <input 
                        type="email" id="email" name="email" 
                        value={formData.email} onChange={handleChange} 
                        required disabled={isLoading || isEditing} // Email edit karna disable karein
                        className={inputClass + (isEditing ? " bg-gray-100" : "")} // Editing mein grey background
                        autoComplete="email" 
                    />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="full_name" className={labelClass}>Full Name</label>
                    <input 
                        type="text" id="full_name" name="full_name" // 'full_name' istemaal karein
                        value={formData.full_name} onChange={handleChange} 
                        disabled={isLoading} className={inputClass} autoComplete="name" 
                    />
                </div>
                
                {/* Password Fields */}
                {!isEditing && (
                    <>
                        <div className="sm:col-span-1">
                            <label htmlFor="password" className={labelClass}>Password *</label>
                            <input 
                                type="password" id="password" name="password" 
                                value={formData.password} onChange={handleChange} 
                                required={!isEditing} disabled={isLoading} 
                                className={inputClass} autoComplete="new-password" 
                            />
                        </div>
                         <div className="sm:col-span-1">
                            <label htmlFor="passwordConfirm" className={labelClass}>Confirm Password *</label>
                            <input 
                                type="password" id="passwordConfirm" name="passwordConfirm" 
                                value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} 
                                required={!isEditing} disabled={isLoading} 
                                className={inputClass} autoComplete="new-password" 
                            />
                        </div>
                    </>
                )}
                
                {/* Role and Status */}
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
                 {isEditing && (
                     <div className="sm:col-span-2">
                        <label htmlFor="password" className={labelClass}>New Password (Optional)</label>
                        <input 
                            type="password" id="password" name="password" 
                            value={formData.password} onChange={handleChange} 
                            disabled={isLoading} className={inputClass} autoComplete="new-password" 
                        />
                        <small className="text-xs text-gray-500">Leave blank to keep current password.</small>
                    </div>
                 )}
            </div>

            {/* Modal Action Buttons (Footer) */}
            <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200 mt-4">
                <button 
                    type="button" // Type 'button' taaki form submit na ho
                    className={secondaryButtonClass} 
                    onClick={onCancel} // Parent se 'onCancel' call karein
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button 
                    type="submit" // Type 'submit' taaki form submit ho
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