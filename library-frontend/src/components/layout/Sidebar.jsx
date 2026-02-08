import React, { useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { 
    HomeIcon, 
    BookOpenIcon, 
    UsersIcon, 
    ShieldCheckIcon, 
    ClipboardDocumentCheckIcon,
    DocumentDuplicateIcon,
    TagIcon,
    LanguageIcon,
    MapPinIcon,
    LockClosedIcon,
    ComputerDesktopIcon,
    ClockIcon,
    ArrowLeftOnRectangleIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // --- Helper to check Permission ---
    // Agar user Admin hai, to sab dikhao. Warna check karein.
    const hasPermission = (permName) => {
        if (!user) return false;
        // Super Admin gets everything
        if (user.role?.name?.toLowerCase() === 'admin' || user.role?.name?.toLowerCase() === 'superadmin') return true;
        
        // Check permissions array (backend se aani chahiye user object mein)
        // Note: Ensure your login API returns permissions list inside 'user' object
        return user.permissions?.includes(permName);
    };

    // --- Menu Configuration ---
    const menuGroups = useMemo(() => [
        {
            title: "Overview",
            items: [
                { name: "Dashboard", path: "/admin/dashboard", icon: HomeIcon, requiredPerm: null }, // Everyone sees Dashboard
                { name: "Access Requests", path: "/admin/access-requests", icon: LockClosedIcon, requiredPerm: "REQUEST_VIEW" },
                { name: "Approvals", path: "/admin/approvals", icon: CheckBadgeIcon, requiredPerm: "BOOK_APPROVE" },
            ]
        },
        {
            title: "Library Management",
            items: [
                { name: "All Books", path: "/admin/books", icon: BookOpenIcon, requiredPerm: "BOOK_VIEW" },
                { name: "Copies & Issuing", path: "/admin/copies", icon: DocumentDuplicateIcon, requiredPerm: "BOOK_ISSUE" },
                { name: "Categories", path: "/admin/categories", icon: TagIcon, requiredPerm: "BOOK_MANAGE" },
                { name: "Subcategories", path: "/admin/subcategories", icon: TagIcon, requiredPerm: "BOOK_MANAGE" },
            ]
        },
        {
            title: "Settings & Users",
            items: [
                { name: "Users Management", path: "/admin/users", icon: UsersIcon, requiredPerm: "USER_VIEW" },
                { name: "Languages", path: "/admin/languages", icon: LanguageIcon, requiredPerm: "BOOK_MANAGE" },
                { name: "Locations", path: "/admin/locations", icon: MapPinIcon, requiredPerm: "BOOK_MANAGE" },
                { name: "Roles & Permissions", path: "/admin/roles-permissions", icon: ShieldCheckIcon, requiredPerm: "ROLE_VIEW" },
            ]
        },
        {
            title: "Security",
            items: [
                { name: "Restricted Books", path: "/admin/book-permissions", icon: LockClosedIcon, requiredPerm: "PERMISSION_VIEW" },
                { name: "Digital Access", path: "/admin/digital-access-history", icon: ComputerDesktopIcon, requiredPerm: "LOGS_VIEW" },
                { name: "Audit Logs", path: "/admin/logs", icon: ClockIcon, requiredPerm: "LOGS_VIEW" },
            ]
        }
    ], [user]);

    // --- Logout Handler ---
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-50 overflow-y-auto border-r border-slate-800 shadow-2xl">
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
                <div className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
                    <BookOpenIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">BookNest is working </h1>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Admin Panel</p>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-6 space-y-8">
                {menuGroups.map((group, idx) => {
                    // Filter items based on permissions
                    const visibleItems = group.items.filter(item => 
                        !item.requiredPerm || hasPermission(item.requiredPerm)
                    );

                    // If group has no visible items, hide the whole group
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={idx}>
                            <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                {group.title}
                            </h3>
                            <ul className="space-y-1">
                                {visibleItems.map((item) => (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            className={({ isActive }) => `
                                                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                                ${isActive 
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 translate-x-1' 
                                                    : 'hover:bg-slate-800 hover:text-white hover:translate-x-1'
                                                }
                                            `}
                                        >
                                            <item.icon className="h-5 w-5 opacity-70" />
                                            {item.name}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </nav>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user?.username || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email || 'No Email'}</p>
                    </div>
                </div>
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group"
                >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;