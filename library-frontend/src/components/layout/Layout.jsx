import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bars3Icon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import AdminSidebar from '../admin/AdminSidebar'; // Humara naya Sidebar Component

const Layout = () => {
    // Mobile ke liye sidebar toggle state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            
            {/* ==========================================
                SIDEBAR SECTION
               ========================================== */}
            
            {/* Desktop Sidebar (Always Visible) */}
            <div className="hidden lg:block lg:w-64 flex-shrink-0 transition-all duration-300">
                <AdminSidebar />
            </div>

            {/* Mobile Sidebar (Overlay & Drawer) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    {/* Backdrop (Click to close) */}
                    <div 
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>

                    {/* Sidebar Content */}
                    <div className="relative w-64 bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300">
                         {/* Close Button is handled inside sidebar or by clicking outside */}
                        <AdminSidebar mobileClose={() => setIsSidebarOpen(false)} />
                    </div>
                </div>
            )}


            {/* ==========================================
                MAIN CONTENT AREA
               ========================================== */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                
                {/* --- HEADER / NAVBAR --- */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-20 sticky top-0">
                    
                    {/* Left: Mobile Toggle & Title */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-bold text-slate-700 hidden sm:block">
                            Admin Dashboard
                        </h2>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                            <BellIcon className="w-6 h-6" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>

                        {/* Profile Dropdown Trigger (Simple UI for now) */}
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-slate-800">Administrator</p>
                                <p className="text-xs text-slate-500">Super Admin</p>
                            </div>
                            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-sm">
                                <UserCircleIcon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* --- PAGE CONTENT (Outlet) --- */}
                {/* Yahan par Dashboard, Books, AccessRequests sab render honge */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>

            </div>
        </div>
    );
};

export default Layout;