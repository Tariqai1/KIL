import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
    HomeIcon, 
    BookOpenIcon, 
    UsersIcon, 
    ShieldCheckIcon, // Access Requests ke liye icon
    ArrowLeftOnRectangleIcon,
    XMarkIcon,
    ClipboardDocumentListIcon,
    KeyIcon,
    QueueListIcon,
    CheckBadgeIcon,
    TagIcon,
    RectangleStackIcon,
    LanguageIcon,
    MapPinIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';

const AdminSidebar = ({ mobileClose }) => {
    const location = useLocation();
    const [pendingCount, setPendingCount] = useState(0);

    // --- 1. Pending Requests Count Fetch Logic ---
    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                // Backend se list mangwa kar pending filter kar rahe hain
                const res = await axios.get('http://127.0.0.1:8000/api/restricted-requests/list');
                const pending = res.data.filter(r => r.status === 'pending').length;
                setPendingCount(pending);
            } catch (error) {
                console.error("Sidebar count fetch error", error);
            }
        };

        fetchPendingCount();
        
        // Har 30 second mein auto-refresh karein taaki admin ko naya notification mile
        const interval = setInterval(fetchPendingCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // --- 2. Menu Items Configuration ---
    const menuItems = [
        { 
            section: "Main",
            items: [
                { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
                { name: 'Access Requests', path: '/admin/access-requests', icon: ShieldCheckIcon, badge: pendingCount }, // 🔴 NEW
                { name: 'Book Management', path: '/admin/books', icon: BookOpenIcon },
                { name: 'Copies & Issuing', path: '/admin/copies', icon: QueueListIcon },
                { name: 'Users', path: '/admin/users', icon: UsersIcon },
                { name: 'Approvals', path: '/admin/approvals', icon: CheckBadgeIcon },
            ]
        },
        {
            section: "Configuration",
            items: [
                { name: 'Categories', path: '/admin/categories', icon: TagIcon },
                { name: 'Subcategories', path: '/admin/subcategories', icon: RectangleStackIcon },
                { name: 'Languages', path: '/admin/languages', icon: LanguageIcon },
                { name: 'Locations', path: '/admin/locations', icon: MapPinIcon },
            ]
        },
        {
            section: "Security & Logs",
            items: [
                { name: 'Roles & Perms', path: '/admin/roles', icon: ShieldCheckIcon },
                { name: 'Restricted Books', path: '/admin/book-permissions', icon: LockClosedIcon },
                { name: 'Digital Access', path: '/admin/digital-access', icon: KeyIcon },
                { name: 'Audit Logs', path: '/admin/logs', icon: ClipboardDocumentListIcon },
            ]
        }
    ];

    return (
        <div className="h-full bg-slate-900 text-white flex flex-col w-64 border-r border-slate-800">
            
            {/* --- Logo Header --- */}
            <div className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl tracking-tight">
                    <BookOpenIcon className="w-6 h-6" />
                    <span>BookNest</span>
                </div>
                {/* Mobile Close Button */}
                {mobileClose && (
                    <button onClick={mobileClose} className="lg:hidden text-slate-400 hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* --- Navigation Scroll Area --- */}
            <nav className="flex-1 overflow-y-auto py-4 space-y-6 px-3 custom-scrollbar">
                {menuItems.map((group, idx) => (
                    <div key={idx}>
                        <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            {group.section}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={mobileClose} // Mobile par link click hone par sidebar band ho
                                    className={({ isActive }) => `
                                        group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                        ${isActive 
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' 
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-emerald-300'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        <span>{item.name}</span>
                                    </div>
                                    
                                    {/* Notification Badge */}
                                    {item.badge > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                                            {item.badge}
                                        </span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* --- Footer / Logout --- */}
            <div className="p-4 border-t border-slate-800 bg-slate-950">
                <NavLink 
                    to="/logout" 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                </NavLink>
            </div>
        </div>
    );
};

export default AdminSidebar;