// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { authService } from '../api/authService'; // Import authService directly
import toast from 'react-hot-toast'; 
import { 
    UserIcon, 
    LockClosedIcon, 
    EyeIcon, 
    EyeSlashIcon, 
    ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const Login = () => {
    // --- State ---
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- Hooks ---
    // Note: Yahan hum context wale 'login' ko rename karke 'setAuthData' bula rahe hain
    // taaki confusion na ho. Ye sirf state update karega.
    const { login: setAuthData } = useAuth(); 
    
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    // --- Handlers ---
    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!credentials.username || !credentials.password) {
            toast.error("Please enter both username and password.");
            return;
        }
    
        setLoading(true);
        const toastId = toast.loading("Logging in..."); 
    
        try {
            // STEP 1: API Call
            const result = await authService.login(credentials.username, credentials.password);
    
            // STEP 2: Check Success
            if (result.success) {
                toast.success("Welcome back!", { id: toastId });
                
                // STEP 3: Update Context
                setAuthData(result); 
                
                // STEP 4: Redirect Logic (The Traffic Police 🚦)
                
                // Backend kabhi role object bhejta hai, kabhi string. Dono handle karein:
                const userRole = result.user?.role?.name || result.user?.role || "Member";
    
                // Debugging ke liye (Browser Console me check karein)
                console.log("🔍 Logged In User Role:", userRole);
    
                if (userRole === 'Admin' || userRole === 'SuperAdmin') {
                    // 🛑 Case A: Sirf Admin yahan jayega
                    console.log("Redirecting to Admin Dashboard...");
                    navigate('/admin/dashboard', { replace: true });
                } else {
                    // 🟢 Case B: Student/Member yahan jayega (Library Home)
                    console.log("Redirecting to Library Home...");
                    
                    // Agar user kisi protected page se aaya tha wahan bhejo, warna Home pe
                    // Note: Agar wo galti se admin login page se aaya tha, to use home bhej do
                    const destination = (from === "/login" || from === "/admin/dashboard") ? "/" : from;
                    navigate(destination, { replace: true });
                }
    
            } else {
                toast.error("Invalid response from server", { id: toastId });
            }
        } catch (err) {
            console.error("Login Error:", err);
            const errorMsg = err.response?.data?.detail || "Invalid username or password";
            toast.error(errorMsg, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100">
                
                {/* Header */}
                <div className="bg-slate-900 p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                        <ArrowRightOnRectangleIcon className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
                    <p className="text-slate-400 mt-2 text-sm">Sign in to access the Library Hub</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        
                        {/* Username */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                                Username
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                                    <UserIcon className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    value={credentials.username}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-slate-700 bg-slate-50 focus:bg-white"
                                    placeholder="Enter your username"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                                    <LockClosedIcon className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-slate-700 bg-slate-50 focus:bg-white"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <div className="flex justify-end mt-2">
                                <a href="#" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center border-t border-slate-100 pt-6">
                        <p className="text-sm text-slate-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="fixed bottom-4 text-xs text-slate-400">
                &copy; 2024 Library Management System. Secure Access.
            </div>
        </div>
    );
};

export default Login;