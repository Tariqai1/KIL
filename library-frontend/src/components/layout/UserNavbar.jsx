// src/components/layout/UserNavbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpenIcon, 
    UserCircleIcon, 
    ArrowRightOnRectangleIcon, 
    Bars3Icon, 
    XMarkIcon 
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';

const UserNavbar = () => {
    const { user, isAuth, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    
                    {/* --- 1. Logo Section (Professional) --- */}
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
                            {/* Icon Wrapper */}
                            <div className="bg-slate-900 p-2 rounded-md group-hover:bg-slate-800 transition-colors">
                                <BookOpenIcon className="h-5 w-5 text-white" />
                            </div>
                            {/* Text Logo */}
                            <span className="font-semibold text-xl text-slate-900 tracking-tight">
                                BookNest
                            </span>
                        </Link>
                    </div>

                    {/* --- 2. Desktop Navigation --- */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link 
                            to="/books" 
                            className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
                        >
                            Browse Library
                        </Link>
                        
                        {/* Vertical Divider */}
                        <div className="h-6 w-px bg-gray-200"></div>

                        {isAuth ? (
                            // --- STATE: LOGGED IN ---
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-slate-500">Welcome,</span>
                                    <span className="text-sm font-semibold text-slate-900 leading-none">
                                        {user?.username || 'User'}
                                    </span>
                                </div>
                                
                                <Link 
                                    to="/profile" 
                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                                    title="Profile"
                                >
                                    <UserCircleIcon className="h-7 w-7" />
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 bg-white border border-gray-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 hover:text-red-600 transition-all"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            // --- STATE: NOT LOGGED IN (GUEST) ---
                            <div className="flex items-center gap-3">
                                <Link 
                                    to="/login" 
                                    className="text-slate-600 hover:text-slate-900 font-medium text-sm px-3 py-2"
                                >
                                    Log in
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="bg-slate-900 text-white px-5 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-slate-800 transition-all"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* --- 3. Mobile Menu Button --- */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-gray-100 focus:outline-none"
                        >
                            {isMobileMenuOpen ? (
                                <XMarkIcon className="h-6 w-6" />
                            ) : (
                                <Bars3Icon className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Mobile Dropdown Menu --- */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
                    >
                        <div className="px-4 pt-4 pb-6 space-y-2">
                            <Link 
                                to="/books" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Browse Library
                            </Link>

                            {isAuth ? (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-3 px-3 mb-4">
                                        <UserCircleIcon className="h-10 w-10 text-slate-300" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{user?.username}</p>
                                            <p className="text-xs text-slate-500">{user?.email}</p>
                                        </div>
                                    </div>
                                    <Link 
                                        to="/profile"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        My Profile
                                    </Link>
                                    <button 
                                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                        className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3 px-3">
                                    <Link 
                                        to="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full text-center border border-gray-300 text-slate-700 px-4 py-2.5 rounded-md font-medium hover:bg-gray-50"
                                    >
                                        Log in
                                    </Link>
                                    <Link 
                                        to="/register"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full text-center bg-slate-900 text-white px-4 py-2.5 rounded-md font-medium hover:bg-slate-800"
                                    >
                                        Create Account
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default UserNavbar;