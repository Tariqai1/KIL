// src/pages/Profile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userService } from '../api/userService'; // Service for all user-related API calls
import useAuth from '../hooks/useAuth'; // To get initial user info (username, email)
import { UserCircleIcon, KeyIcon, BookOpenIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import '../assets/css/ManagementPages.css'; // Reusing some styles if they exist

// Spinner Icon
const SpinnerIcon = ({ className = "text-white" }) => (
    <svg className={`animate-spin -ml-0.5 mr-2 h-4 w-4 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// Animation variants for tab content
const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const Profile = () => {
    // Get the basic user object from the auth context (for display)
    const { user: authUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('details');
    const [error, setError] = useState(null); // Page-level load error

    // --- State for Profile Details Tab ---
    const [profileData, setProfileData] = useState({ full_name: '' });
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState(null);
    const [profileSuccess, setProfileSuccess] = useState(null);

    // --- State for Password Change Tab ---
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);

    // --- State for Issue History Tab ---
    const [issueHistory, setIssueHistory] = useState([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);

    // --- Data Fetching ---
    const fetchProfileData = useCallback(async () => {
        // We only need to fetch data for the 'details' (full_name) and 'history' tabs
        setIsHistoryLoading(true);
        setError(null);
        setProfileError(null);
        setProfileSuccess(null);
        setPasswordError(null);
        setPasswordSuccess(null);
        
        try {
            // Fetch profile (for full_name) and issue history in parallel
            const [meRes, historyRes] = await Promise.allSettled([
                userService.getMe(), // Fetches /api/users/me/
                userService.getMyIssuedBooks(), // Fetches /api/users/me/issued-books/
            ]);

            if (meRes.status === 'fulfilled' && meRes.value) {
                setProfileData({ full_name: meRes.value.full_name || '' });
            } else {
                // If getMe fails, it's a critical error
                throw new Error(meRes.reason?.detail || 'Failed to load profile data.');
            }

            if (historyRes.status === 'fulfilled' && historyRes.value) {
                setIssueHistory(historyRes.value || []);
            } else {
                // If history fails, just show an error for that part
                console.error("History fetch failed:", historyRes.reason);
                setError('Could not load book history. Other details may be available.');
                setIssueHistory([]); // Ensure it's an array
            }
        } catch (err) {
            console.error("Error fetching profile data:", err);
            setError(err.message);
        } finally {
            setIsHistoryLoading(false); // Mark loading as complete
        }
    }, []);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    // --- Handlers ---
    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    // Handle Profile Update (Full Name)
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsProfileLoading(true);
        setProfileError(null);
        setProfileSuccess(null);
        try {
            await userService.updateMe(profileData); // Calls PUT /api/users/me/
            setProfileSuccess('Profile updated successfully!');
            // Optionally: refresh auth context user if name is stored there
            // auth.refreshUser(); 
        } catch (err) {
            setProfileError(err.detail || 'Failed to update profile.');
        } finally {
            setIsProfileLoading(false);
        }
    };

    // Handle Password Change
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setIsPasswordLoading(true);
        setPasswordError(null);
        setPasswordSuccess(null);

        // Frontend validation
        if (
            !passwordData.current_password ||
            !passwordData.new_password ||
            !passwordData.confirm_password
        ) {
            setPasswordError('All fields are required.');
            setIsPasswordLoading(false); return;
        }
        if (passwordData.new_password.length < 8) {
             setPasswordError('New password must be at least 8 characters.');
             setIsPasswordLoading(false); return;
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError('New passwords do not match.');
            setIsPasswordLoading(false); return;
        }
        if (passwordData.current_password === passwordData.new_password) {
             setPasswordError('New password cannot be the same as the current one.');
             setIsPasswordLoading(false); return;
        }

        try {
            await userService.changePassword(passwordData); // Calls POST /api/users/me/change-password/
            setPasswordSuccess('Password changed successfully! You will be logged out.');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' }); // Clear form
            
            // Log out user after successful password change for security
            setTimeout(() => {
                logout();
            }, 3000); // Wait 3 seconds

        } catch (err) {
            setPasswordError(err.detail || 'Failed to change password. Check your current password.');
        } finally {
            setIsPasswordLoading(false);
        }
    };

    // --- Tailwind Classes ---
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const buttonClass = `inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`;
    const primaryButtonClass = `${buttonClass} bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;
    const tabButtonClass = (tabName) =>
        `flex items-center whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none ${
            activeTab === tabName
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;

    return (
        <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
            <div className="p-4 md:p-6 space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">
                    My Profile
                </h2>
                
                {/* Page-level error (e.g., if loading fails completely) */}
                {error && <p className="error-message p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">{error}</p>}

                {/* --- Tab Navigation --- */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        <button onClick={() => setActiveTab('details')} className={tabButtonClass('details')}>
                            <UserCircleIcon className="h-5 w-5 mr-2" /> Profile Details
                        </button>
                        <button onClick={() => setActiveTab('password')} className={tabButtonClass('password')}>
                            <KeyIcon className="h-5 w-5 mr-2" /> Change Password
                        </button>
                        <button onClick={() => setActiveTab('history')} className={tabButtonClass('history')}>
                            <BookOpenIcon className="h-5 w-5 mr-2" /> Book History
                        </button>
                    </nav>
                </div>

                {/* --- Tab Content --- */}
                <AnimatePresence mode="wait">
                    {/* --- Profile Details Tab --- */}
                    {activeTab === 'details' && (
                        <motion.div
                            key="details"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-lg space-y-4">
                                <h3 className="text-lg font-medium text-gray-800">
                                    Your Information
                                </h3>
                                {profileError && <p className="error-message text-sm text-red-600 text-center p-2 bg-red-50 rounded-md">{profileError}</p>}
                                {profileSuccess && <p className="success-message text-sm text-green-600 text-center p-2 bg-green-50 rounded-md">{profileSuccess}</p>}

                                {/* Show skeleton while authUser or profileData is loading */}
                                {!authUser || isHistoryLoading ? ( // Use isHistoryLoading as the main page load indicator
                                    <div className="space-y-4">
                                        <div><Skeleton height={16} width={100} /><Skeleton height={38} /></div>
                                        <div><Skeleton height={16} width={100} /><Skeleton height={38} /></div>
                                        <div><Skeleton height={16} width={100} /><Skeleton height={38} /></div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label htmlFor="username" className={labelClass}>Username (Read-only)</label>
                                            <input type="text" id="username" name="username" value={authUser?.username || ''} disabled className={`${inputClass} bg-gray-100 cursor-not-allowed`} />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className={labelClass}>Email (Read-only)</label>
                                            <input type="email" id="email" name="email" value={authUser?.email || ''} disabled className={`${inputClass} bg-gray-100 cursor-not-allowed`} />
                                        </div>
                                        <div>
                                            <label htmlFor="full_name" className={labelClass}>Full Name</label>
                                            <input type="text" id="full_name" name="full_name" value={profileData.full_name} onChange={handleProfileChange} className={inputClass} disabled={isProfileLoading} />
                                        </div>
                                        <div className="text-right pt-2">
                                            <button type="submit" className={primaryButtonClass} disabled={isProfileLoading}>
                                                {isProfileLoading && <SpinnerIcon />}
                                                {isProfileLoading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </motion.div>
                    )}

                    {/* --- Change Password Tab --- */}
                    {activeTab === 'password' && (
                        <motion.div
                            key="password"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-lg space-y-4">
                                <h3 className="text-lg font-medium text-gray-800">
                                    Change Your Password
                                </h3>
                                {passwordError && <p className="error-message text-sm text-red-600 text-center p-2 bg-red-50 rounded-md">{passwordError}</p>}
                                {passwordSuccess && <p className="success-message text-sm text-green-600 text-center p-2 bg-green-50 rounded-md">{passwordSuccess}</p>}
                                
                                <div>
                                    <label htmlFor="current_password" className={labelClass}>Current Password *</label>
                                    <input type="password" id="current_password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} required className={inputClass} disabled={isPasswordLoading} />
                                </div>
                                <div>
                                    <label htmlFor="new_password" className={labelClass}>New Password *</label>
                                    <input type="password" id="new_password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} required className={inputClass} disabled={isPasswordLoading} />
                                </div>
                                <div>
                                    <label htmlFor="confirm_password" className={labelClass}>Confirm New Password *</label>
                                    <input type="password" id="confirm_password" name="confirm_password" value={passwordData.confirm_password} onChange={handlePasswordChange} required className={inputClass} disabled={isPasswordLoading} />
                                </div>
                                <div className="text-right pt-2">
                                    <button type="submit" className={primaryButtonClass} disabled={isPasswordLoading}>
                                        {isPasswordLoading && <SpinnerIcon />}
                                        {isPasswordLoading ? 'Changing...' : 'Change Password'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* --- Book History Tab --- */}
                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                                <h3 className="text-lg font-medium text-gray-800 mb-4">
                                    My Book History
                                </h3>
                                {isHistoryLoading ? (
                                    <Skeleton height={40} count={5} />
                                ) : issueHistory.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Title</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Copy ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Returned Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {issueHistory.map((issue) => (
                                                    <tr key={issue.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{issue.book_copy?.book?.title || 'Unknown Book'}</td>
                                                        <td className="px-4 py-4 text-sm text-gray-500">{issue.copy_id}</td>
                                                        <td className="px-4 py-4 text-sm">
                                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                issue.status?.toLowerCase() === 'issued' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800' // Assuming 'Returned'
                                                            }`}>
                                                                {issue.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-gray-500">{issue.issue_date ? new Date(issue.issue_date).toLocaleDateString() : 'N/A'}</td>
                                                        <td className="px-4 py-4 text-sm text-gray-500">{issue.due_date ? new Date(issue.due_date).toLocaleDateString() : 'N/A'}</td>
                                                        <td className="px-4 py-4 text-sm text-gray-500">{issue.return_date ? new Date(issue.return_date).toLocaleDateString() : 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 py-6">
                                        You have no book borrowing history.
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </SkeletonTheme>
    );
};

export default Profile;