// src/components/layout/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
// Example icon for potential dropdown
import { ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/20/solid'; // Use solid icons for UI elements
// Import Headless UI Menu if using dropdown
// import { Menu, Transition } from '@headlessui/react';
// import { Fragment } from 'react'; // For Transition

const Navbar = () => {
    const { logout, user } = useAuth(); // Assuming 'user' object with name/email might exist in AuthContext later
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <motion.header
            initial={{ opacity: 0 }} // Simple fade in
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            // Increased height, softer shadow, padding adjusted
            className="h-16 md:h-20 bg-white shadow-sm flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 border-b border-gray-200 sticky top-0 z-10"
        >
            {/* Left side: Maybe Search Bar later */}
            <div>
                 {/* Can add search bar here */}
                 {/* <input type="search" placeholder="Search..." className="..."/> */}
            </div>

            {/* Right side - User menu / Logout */}
            <div className="flex items-center space-x-3 md:space-x-4">
                {/* Display username if available in context */}
                {/* <span className="text-sm font-medium text-gray-600 hidden sm:block">
                    Welcome, {user?.username || 'Admin'}!
                </span> */}

                {/* Simple Logout Button */}
                <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-md transition-colors duration-150 group" // Softer red button
                    title="Logout"
                >
                     <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1 text-red-500 group-hover:text-red-600" /> {/* Logout Icon */}
                     <span className="hidden sm:inline">Logout</span> {/* Hide text on small screens */}
                </motion.button>

                 {/* Dropdown Example (using Headless UI Menu) - Uncomment and adapt if needed
                 <Menu as="div" className="relative">
                    <div>
                        <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <span className="sr-only">Open user menu</span>
                            <img className="h-8 w-8 rounded-full bg-gray-200" src="" alt="" /> User avatar
                            <span className="hidden md:block ml-2 text-sm font-medium text-gray-700">{user?.username || 'Account'}</span>
                            <ChevronDownIcon className="hidden md:block ml-1 h-5 w-5 text-gray-400" />
                        </Menu.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                            <Menu.Item>
                                {({ active }) => ( <a href="#" className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}>Your Profile</a> )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => ( <button onClick={handleLogout} className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}>Logout</button> )}
                            </Menu.Item>
                        </Menu.Items>
                    </Transition>
                 </Menu>
                 */}
            </div>
        </motion.header>
    );
};

export default Navbar;