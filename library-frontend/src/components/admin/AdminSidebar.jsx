import React, { useState, useEffect, useMemo, useCallback } from 'react';
import restrictedBookService from '../../api/restrictedBookService';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
    HomeIcon, BookOpenIcon, UsersIcon, ShieldCheckIcon, 
    ArrowLeftOnRectangleIcon, XMarkIcon, ClipboardDocumentListIcon, 
    KeyIcon, CheckBadgeIcon, TagIcon, RectangleStackIcon, 
    LanguageIcon, MapPinIcon, LockClosedIcon, UserCircleIcon, 
    ComputerDesktopIcon, DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

// ✅ Custom Hooks & Services
import useAuth from '../../hooks/useAuth'; 
 

const AdminSidebar = ({ mobileClose = () => {} }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); 
    const [pendingCount, setPendingCount] = useState(0);

    // --- 1. Advanced Permission Checker (Memoized for Performance) ---
    const hasPermission = useCallback((permCode) => {
        // Agar user login hi nahi hai
        if (!user) return false;
        
        // 1. Super Admin Bypass (Role ko safe tarike se check karna)
        // Kabhi role object hota hai {name: 'Admin'}, kabhi string 'Admin'
        const roleName = user.role?.name || user.role || '';
        const normalizedRole = String(roleName).toLowerCase();

        if (['admin', 'superadmin', 'administrator'].includes(normalizedRole)) return true;

        // 2. Public Items (Jinke liye permission null hai)
        if (!permCode) return true;

        // 3. Check Permissions Array Safely
        // Ensure karte hain ki permissions exist kare aur array ho
        return Array.isArray(user.permissions) && user.permissions.includes(permCode);
    }, [user]);

    // --- 2. Fetch Pending Requests Count (Safe & Optimized) ---
    useEffect(() => {
        let isMounted = true; // Memory leak rokne ke liye

        const fetchPendingCount = async () => {
            // Agar user ko Requests dekhne ki permission hi nahi hai, to call mat karo
            if (!user || !hasPermission('REQUEST_VIEW')) return;

            try {
                const data = await restrictedBookService.getAllRequests();
                if (isMounted && Array.isArray(data)) {
                    const pending = data.filter(r => r.status === 'pending').length;
                    setPendingCount(pending);
                }
            } catch (error) {
                console.error("Sidebar Count Error:", error);
            }
        };

        fetchPendingCount();
        
        // Har 30 second mein refresh karein
        const interval = setInterval(fetchPendingCount, 30000);

        // Cleanup function
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [user, hasPermission]);

    // --- 3. Handle Logout ---
    const handleLogout = async () => {
        try {
            await logout(); 
            navigate('/login'); 
        } catch (error) {
            console.error("Logout failed", error);
            // Agar API fail bhi ho jaye, tab bhi client side logout kar do
            navigate('/login'); 
        }
    };

    // --- 4. Menu Configuration ---
    // useMemo use kiya taake har render par list dobara na bane
    const menuItems = useMemo(() => [
        { 
            section: "Overview",
            items: [
                { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon, requiredPerm: null },
                { name: 'Access Requests', path: '/admin/access-requests', icon: ShieldCheckIcon, badge: pendingCount, requiredPerm: 'REQUEST_VIEW' },
                { name: 'Approvals', path: '/admin/approvals', icon: CheckBadgeIcon, requiredPerm: 'BOOK_APPROVE' },
            ]
        },
        { 
            section: "Library Management",
            items: [
                { name: 'All Books', path: '/admin/books', icon: BookOpenIcon, requiredPerm: 'BOOK_VIEW' },
                // ✅ Corrected: Yahan BOOK_ISSUE use kiya hai jo Student2 ke paas hai
                { name: 'Copies & Issuing', path: '/admin/copies', icon: DocumentDuplicateIcon, requiredPerm: 'BOOK_ISSUE' },
                { name: 'Categories', path: '/admin/categories', icon: TagIcon, requiredPerm: 'BOOK_MANAGE' },
                { name: 'Subcategories', path: '/admin/subcategories', icon: RectangleStackIcon, requiredPerm: 'BOOK_MANAGE' },
            ]
        },
        {
            section: "Settings & Users",
            items: [
                { name: 'Users Management', path: '/admin/users', icon: UsersIcon, requiredPerm: 'USER_VIEW' },
                { name: 'Languages', path: '/admin/languages', icon: LanguageIcon, requiredPerm: 'BOOK_MANAGE' },
                { name: 'Locations', path: '/admin/locations', icon: MapPinIcon, requiredPerm: 'BOOK_MANAGE' },
                { name: 'Roles & Permissions', path: '/admin/roles-permissions', icon: KeyIcon, requiredPerm: 'ROLE_VIEW' },
            ]
        },
        {
            section: "Security",
            items: [
                { name: 'Restricted Books', path: '/admin/book-permissions', icon: LockClosedIcon, requiredPerm: 'PERMISSION_VIEW' },
                { name: 'Digital Access', path: '/admin/digital-access-history', icon: ComputerDesktopIcon, requiredPerm: 'LOGS_VIEW' },
                { name: 'Audit Logs', path: '/admin/logs', icon: ClipboardDocumentListIcon, requiredPerm: 'LOGS_VIEW' },
            ]
        }
    ], [pendingCount, hasPermission]);

    return (
        <div className="h-full bg-[#0f172a] text-slate-300 flex flex-col w-64 border-r border-slate-800 shadow-2xl">
            
            {/* --- Header --- */}
            <div className="h-20 flex items-center justify-between px-6 bg-[#020617] border-b border-slate-800 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
                        <BookOpenIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg tracking-tight leading-none">BookNest</h1>
                        <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest">Admin Panel</span>
                    </div>
                </div>
                {/* Mobile Close Button */}
                {mobileClose && (
                    <button onClick={mobileClose} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* --- Navigation Items --- */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
                {menuItems.map((group, idx) => {
                    // Filter items based on permissions
                    const visibleItems = group.items.filter(item => hasPermission(item.requiredPerm));
                    
                    // Agar section khali hai to render mat karo
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={idx}>
                            <h3 className="px-3 text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
                                {group.section}
                            </h3>
                            <div className="space-y-1">
                                {visibleItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={mobileClose}
                                        className={({ isActive }) => `
                                            group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-transparent
                                            ${isActive 
                                                ? 'bg-emerald-600/10 text-emerald-400 border-emerald-600/20 shadow-sm' 
                                                : 'hover:bg-slate-800/50 hover:text-white'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${item.badge > 0 ? 'text-emerald-400' : ''}`} />
                                            <span>{item.name}</span>
                                        </div>
                                        {/* Notification Badge */}
                                        {item.badge > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                                {item.badge}
                                            </span>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* --- User Profile Footer --- */}
            <div className="p-4 border-t border-slate-800 bg-[#020617] sticky bottom-0 z-10">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shadow-inner">
                        <UserCircleIcon className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user?.username || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email || 'user@booknest.com'}</p>
                    </div>
                </div>

                <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/20 transition-all text-sm font-bold group"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;