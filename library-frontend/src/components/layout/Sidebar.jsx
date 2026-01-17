// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
// Import icons from Heroicons (example)
import {
    HomeIcon, BookOpenIcon, UsersIcon, CheckBadgeIcon, TagIcon, FolderIcon, GlobeAltIcon, MapPinIcon,
    KeyIcon, ShieldCheckIcon, DocumentTextIcon, ComputerDesktopIcon, QueueListIcon
} from '@heroicons/react/24/outline'; // Use outline icons for a lighter look

// Define navigation links with icons
const navLinks = [
    { to: "/", icon: HomeIcon, label: "Dashboard", end: true },
    { to: "/books", icon: BookOpenIcon, label: "Book Management" },
    { to: "/copies-issuing", icon: QueueListIcon, label: "Copies & Issuing" }, // Changed icon
    { to: "/users", icon: UsersIcon, label: "User Management" },
    { to: "/approvals", icon: CheckBadgeIcon, label: "Approvals" },
    { type: 'divider', label: 'Configuration' },
    { to: "/categories", icon: TagIcon, label: "Categories" },
    { to: "/subcategories", icon: FolderIcon, label: "Subcategories" },
    { to: "/languages", icon: GlobeAltIcon, label: "Languages" },
    { to: "/locations", icon: MapPinIcon, label: "Locations" },
    { type: 'divider', label: 'Security & Logs' },
    { to: "/roles-permissions", icon: KeyIcon, label: "Roles & Permissions" },
    { to: "/restricted-permissions", icon: ShieldCheckIcon, label: "Restricted Books" },
    { to: "/audit-logs", icon: DocumentTextIcon, label: "Audit Logs" },
    { to: "/digital-access", icon: ComputerDesktopIcon, label: "Digital Access" },
];

// Animation variants for list items
const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (i) => ({
        x: 0,
        opacity: 1,
        transition: { delay: i * 0.04, duration: 0.25, ease: 'easeOut' } // Faster stagger
    }),
};

const Sidebar = () => {
    return (
        // Slightly wider, softer shadow, subtle gradient background possibility
        <aside className="w-64 bg-gradient-to-b from-white to-gray-50 text-gray-800 shadow-lg flex flex-col flex-shrink-0 min-h-screen border-r border-gray-200">
            {/* Header with more padding */}
            <div className="h-20 flex items-center justify-center border-b border-gray-200">
                <h1 className="text-2xl font-bold text-indigo-600 tracking-tight"> {/* Different color, tracking */}
                    📚 BookNest
                </h1>
            </div>

            {/* Navigation - adjusted padding, text size */}
            <nav className="flex-grow p-3 space-y-1 overflow-y-auto"> {/* Less padding inside nav */}
                {navLinks.map((link, index) => (
                    link.type === 'divider' ? (
                        // Divider styling
                        <div key={`divider-${index}`} className="pt-5 pb-1 px-3">
                            <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">{link.label}</span>
                        </div>
                    ) : (
                    <motion.div
                        key={link.to || `link-${index}`}
                        custom={index} // Pass index for stagger
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <NavLink
                            to={link.to}
                            // Modernized active/inactive styles
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out group ${ // Added group for potential hover effects on icon
                                isActive
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' // Softer active background, text color, subtle shadow
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800' // Lighter inactive text, slightly darker hover
                                }`
                            }
                            end={link.end}
                        >
                            {/* Render Heroicon */}
                            <link.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${ // Icon size, margin, prevent shrinking
                                 ({isActive}) => isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500' // Icon color change
                                }`} aria-hidden="true" />
                            {link.label}
                        </NavLink>
                    </motion.div>
                    )
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;