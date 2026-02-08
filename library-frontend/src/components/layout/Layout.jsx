import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
    Bars3Icon, 
    BellIcon, 
    PlusIcon,           // Add Post Icon
    HeartIcon,          // Donation Icon
    MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import AdminSidebar from '../admin/AdminSidebar';

const Layout = () => {
    // --- State & Hooks ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-[#F3F6F9] overflow-hidden font-sans">
            
            {/* ==========================================
                1. SIDEBAR SECTION
               ========================================== */}
            
            {/* Desktop Sidebar (Always Visible) */}
            <div className="hidden lg:block lg:w-72 flex-shrink-0 transition-all duration-300">
                <AdminSidebar />
            </div>

            {/* Mobile Sidebar (Overlay & Drawer) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>

                    {/* Sidebar Content */}
                    <div className="relative w-72 bg-[#001D3D] shadow-2xl animate-in slide-in-from-left duration-300">
                        <AdminSidebar mobileClose={() => setIsSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* ==========================================
                2. MAIN CONTENT AREA
               ========================================== */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                
                {/* --- HEADER / NAVBAR --- */}
                <header className="h-20 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-8 z-20 sticky top-0 shadow-sm">
                    
                    {/* Left: Mobile Toggle & Search/Title */}
                    <div className="flex items-center gap-4 flex-1">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <Bars3Icon className="w-7 h-7" />
                        </button>
                        
                        {/* Title or Search Bar */}
                        <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 w-full max-w-md focus-within:ring-2 focus-within:ring-[#002147]/20 transition-all">
                            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search here..." 
                                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* Right: Actions & Profile */}
                    <div className="flex items-center gap-3 sm:gap-5">

                        {/* ✅ NEW: Quick Action - ADD POST */}
                        <button 
                            onClick={() => navigate('/admin/posts/add')} // Post Add Page Route
                            className="hidden md:flex items-center gap-2 bg-[#002147] hover:bg-[#003366] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/10 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>Add Post</span>
                        </button>

                        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

                        {/* ✅ DONATION UPLOAD SHORTCUT */}
                        <button 
                            onClick={() => navigate('/admin/donation')} // Donation Upload Page
                            className="relative p-2.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-100 transition-all group"
                            title="Upload Donation Details"
                        >
                            <HeartIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            {/* Pulse Indicator */}
                            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                            </span>
                        </button>

                        {/* Notification Bell */}
                        <button className="relative p-2.5 text-slate-400 hover:text-[#002147] hover:bg-slate-50 rounded-xl transition-all">
                            <BellIcon className="w-6 h-6" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>

                        {/* Profile Avatar */}
                        <div className="flex items-center gap-3 pl-2 sm:pl-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-slate-800 leading-none mb-1">Admin</p>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Dashboard</p>
                            </div>
                            <div className="h-11 w-11 bg-gradient-to-br from-[#002147] to-[#003366] rounded-full flex items-center justify-center text-white border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform">
                                <span className="font-bold text-lg">A</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* --- PAGE CONTENT (Outlet) --- */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 scroll-smooth">
                    
                    {/* Mobile FAB: Add Post (Only on small screens) */}
                    <button 
                        onClick={() => navigate('/admin/posts/add')}
                        className="md:hidden fixed bottom-6 right-6 z-50 bg-[#002147] text-white p-4 rounded-full shadow-2xl hover:bg-[#003366] active:scale-90 transition-all"
                    >
                        <PlusIcon className="w-6 h-6" />
                    </button>

                    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>

            </div>
        </div>
    );
};

export default Layout;