// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    UserPlusIcon, 
    UserIcon, 
    EnvelopeIcon, 
    LockClosedIcon, 
    EyeIcon, 
    EyeSlashIcon, 
    IdentificationIcon 
} from '@heroicons/react/24/outline';
import { authService } from '../api/authService';
import toast from 'react-hot-toast';

const Register = () => {
    const navigate = useNavigate();
    
    // --- State ---
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
        password: '',
        confirmPassword: ''
    });
    
    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'password') calculateStrength(value);
    };

    const calculateStrength = (pass) => {
        let score = 0;
        if (!pass) return setPasswordStrength(0);
        if (pass.length > 5) score += 1;
        if (pass.length > 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        setPasswordStrength(score);
    };

    const getStrengthColor = () => {
        if (passwordStrength <= 2) return "bg-red-500";
        if (passwordStrength <= 3) return "bg-yellow-500";
        return "bg-emerald-500";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        if (passwordStrength < 2) {
            toast.error("Password is too weak.");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Creating your account...");

        try {
            await authService.register({
                username: formData.username,
                email: formData.email,
                full_name: formData.full_name,
                password: formData.password
            });
            
            toast.success("Account created successfully!", { id: toastId });
            setTimeout(() => navigate('/login'), 2000);

        } catch (err) {
            const msg = err.response?.data?.detail 
                || (Array.isArray(err.response?.data) ? err.response?.data[0]?.msg : "Registration failed.");
            toast.error(msg, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        // FIX: 'min-h-screen' allows scrolling. 'py-12' ensures safe spacing top/bottom.
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            
            {/* Header Outside Card (Optional, helps visual hierarchy) */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
                 <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Or <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">sign in to your existing account</Link>
                </p>
            </div>

            {/* Main Card Wrapper */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-100 relative overflow-hidden">
                    
                    {/* Decorative Top Bar */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600"></div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Full Name</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <IdentificationIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    name="full_name" type="text" required 
                                    value={formData.full_name} onChange={handleChange}
                                    className="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2.5 border"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Username</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    name="username" type="text" required 
                                    value={formData.username} onChange={handleChange}
                                    className="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2.5 border"
                                    placeholder="Choose a username"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Email Address</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    name="email" type="email" required 
                                    value={formData.email} onChange={handleChange}
                                    className="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2.5 border"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Password</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    name="password" 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    value={formData.password} onChange={handleChange}
                                    className="block w-full pl-10 pr-10 sm:text-sm border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2.5 border"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                                >
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" /> : <EyeIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" /> }
                                </button>
                            </div>
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${getStrengthColor()} transition-all duration-300`} 
                                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 text-right">
                                        Strength: {passwordStrength <= 2 ? 'Weak' : 'Good'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    name="confirmPassword" 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    required 
                                    value={formData.confirmPassword} onChange={handleChange}
                                    className="block w-full pl-10 pr-10 sm:text-sm border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2.5 border"
                                    placeholder="Re-enter password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" /> : <EyeIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" /> }
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 transition-all"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </div>
                                ) : 'Create Account'}
                            </button>
                        </div>

                    </form>
                </div>

                {/* Footer Outside Card */}
                <div className="mt-8">
                     <p className="text-center text-xs text-slate-400">
                        &copy; 2024 Library Management System
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Register;