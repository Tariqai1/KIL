// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';

// Import API services
import { bookService } from '../api/bookService';
import { userService } from '../api/userService';
import { approvalService } from '../api/approvalService';
import { copyIssueService } from '../api/copyIssueService';
import { logService } from '../api/logService';

// Import Icons
import {
    BookOpenIcon, UsersIcon, ClockIcon, ArrowUpOnSquareIcon,
    ListBulletIcon, PresentationChartLineIcon, ChartPieIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';

// Import Recharts components
import {
    LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Import Skeleton Loading
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Animation Variants
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" }
    }),
};
const sectionVariants = {
     hidden: { opacity: 0 },
     visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

// --- Helper: Stat Card Component ---
const StatCard = ({ icon: Icon, title, value, bgColor, index, isLoading }) => (
    <motion.div
        custom={index} variants={cardVariants}
        // Removed the relative positioning if only used for the circle
        className={`p-5 rounded-lg shadow-lg ${bgColor} text-white flex items-start space-x-4 overflow-hidden min-h-[110px]`}
    >
        {/* --- FIX: Removed the absolute positioned decorative circle div --- */}
        {/* <div className="absolute -top-4 -right-4 w-20 h-20 bg-white bg-opacity-10 rounded-full"></div> */}

        {/* Icon */}
        <div className="flex-shrink-0 bg-black bg-opacity-25 rounded-full p-3"> {/* Removed z-10 as it might not be needed now */}
            {isLoading ? <Skeleton circle height={24} width={24} baseColor="#ffffff50" highlightColor="#ffffff80" /> : <Icon className="h-6 w-6 text-white" aria-hidden="true" />}
        </div>
        {/* Text Content */}
        <div> {/* Removed z-10 */}
            <p className="text-sm font-medium uppercase tracking-wider opacity-90">{title}</p>
            {isLoading || value === null ? (
                 <Skeleton height={30} width={80} baseColor="#ffffff50" highlightColor="#ffffff80" containerClassName="mt-1" />
            ) : (
                 <p className="text-3xl font-bold">{value}</p>
            )}
        </div>
    </motion.div>
);

// --- Initial Chart Data ---
// Define the structure and initial state for clarity
const initialBooksAddedData = [
    { month: 'Jan', count: 0 }, { month: 'Feb', count: 0 }, { month: 'Mar', count: 0 },
    { month: 'Apr', count: 0 }, { month: 'May', count: 0 }, { month: 'Jun', count: 0 },
    { month: 'Jul', count: 0 }, { month: 'Aug', count: 0 }, { month: 'Sep', count: 0 },
    { month: 'Oct', count: 0 }, { month: 'Nov', count: 0 }, { month: 'Dec', count: 0 },
];
const initialBookStatusData = [ { name: 'Approved', value: 0 }, { name: 'Pending', value: 0 }];
const STATUS_COLORS = ['#10B981', '#F59E0B']; // Emerald, Amber

// --- Main Dashboard Component ---
const Dashboard = () => {
    const { role } = useAuth();
    const [stats, setStats] = useState({ totalBooks: null, activeUsers: null, pendingApprovals: null, booksOnLoan: null });
    const [recentLogs, setRecentLogs] = useState([]);
    const [booksAddedChartData, setBooksAddedChartData] = useState([]); // Start empty for loading
    const [bookStatusChartData, setBookStatusChartData] = useState([]); // Start empty for loading
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching Logic ---
    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setStats({ totalBooks: null, activeUsers: null, pendingApprovals: null, booksOnLoan: null });
        setRecentLogs([]);
        setBooksAddedChartData([]);
        setBookStatusChartData([]);

        try {
            const [booksRes, usersRes, requestsRes, issuesRes, logsRes] = await Promise.allSettled([
                bookService.getAllBooks(false),
                userService.getAllUsers(),
                approvalService.getAllRequests(),
                copyIssueService.getAllIssues(),
                logService.getRecentLogs(5)
            ]);

            // Calculate Stats & Process Chart Data
            let totalBooks = 0, approvedBooks = 0, pendingBooks = 0;
            const monthlyCounts = initialBooksAddedData.reduce((acc, item) => { acc[item.month] = 0; return acc; }, {}); // Initialize counts

            if (booksRes.status === 'fulfilled' && booksRes.value) {
                totalBooks = booksRes.value.length;
                booksRes.value.forEach(book => {
                    if(book.is_approved) approvedBooks++; else pendingBooks++;
                    // Process for Books Added Chart
                    try {
                        // Ensure created_at exists and is a valid date string
                        if (book.created_at) {
                           const month = new Date(book.created_at).toLocaleString('default', { month: 'short' });
                           if (monthlyCounts.hasOwnProperty(month)) { // Only count if month is valid key
                              monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
                           }
                        }
                    } catch (dateError) {
                        console.warn(`Could not parse date for book ID ${book.id}:`, dateError);
                    }
                });
                // Convert processed counts back to chart format array
                const processedChartData = initialBooksAddedData.map(item => ({
                    ...item,
                    count: monthlyCounts[item.month] || 0 // Use count or 0
                }));
                setBooksAddedChartData(processedChartData);

            } else {
                 console.error("Failed to load books for stats/charts:", booksRes.reason);
                 setBooksAddedChartData(initialBooksAddedData); // Fallback to initial structure with 0s
            }
            // Set Book Status Chart Data
             setBookStatusChartData([
                 { name: 'Approved', value: approvedBooks },
                 { name: 'Pending', value: pendingBooks },
             ]);


            const activeUsers = usersRes.status === 'fulfilled' ? (usersRes.value || []).filter(user => user.status === 'Active').length : 0;
            const pendingApprovals = requestsRes.status === 'fulfilled' ? (requestsRes.value || []).filter(req => req.status === 'Pending').length : 0;
            const booksOnLoan = issuesRes.status === 'fulfilled' ? (issuesRes.value || []).filter(issue => issue.status?.toLowerCase() === 'issued').length : 0;
            setStats({ totalBooks, activeUsers, pendingApprovals, booksOnLoan });


            // Process Recent Logs
            if (logsRes.status === 'fulfilled' && logsRes.value) {
                setRecentLogs(logsRes.value.map(log => ({
                    id: log.id,
                    user: log.action_by?.username || 'System',
                    action: log.action_type || 'UNKNOWN',
                    description: log.description || 'No description',
                    time: log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Invalid date'
                })).slice(0, 5));
            } else {
                 console.error("Failed to load logs:", logsRes.reason);
                 // No fallback dummy data, show empty state
            }
             // Handle potential errors for other fetches if needed
             if (usersRes.status === 'rejected') console.error("Failed to load users:", usersRes.reason);
             if (requestsRes.status === 'rejected') console.error("Failed to load requests:", requestsRes.reason);
             if (issuesRes.status === 'rejected') console.error("Failed to load issues:", issuesRes.reason);


        } catch (err) { // Catch unexpected errors
            console.error("Error fetching dashboard data:", err);
            setError(err.message || "Could not load dashboard data. Please try refreshing.");
            setStats({ totalBooks: 0, activeUsers: 0, pendingApprovals: 0, booksOnLoan: 0 });
            // --- FIX: Use correct state setter and initial data variable ---
            setBooksAddedChartData(initialBooksAddedData); // Use initial structure on error
            setBookStatusChartData(initialBookStatusData); // Use initial structure on error
            // setRecentLogs(recentActivityData); // No dummy fallback for logs
            // --- END FIX ---
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // --- JSX Rendering (No changes needed below this line) ---
    return (
        <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
            <motion.div
                variants={sectionVariants} initial="hidden" animate="visible"
                className="p-4 md:p-6 space-y-6"
            >
                {/* Header with Refresh Button */}
                 <div className="flex justify-between items-center">
                    <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">🏠 Dashboard</h2>
                    <button
                        onClick={fetchDashboardData} disabled={isLoading}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                 </div>

                {error && <p className="error-message p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">{error}</p>}

                {/* Welcome Message */}
                <motion.div variants={cardVariants} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    {/* ... Welcome message content ... */}
                     <h3 className="text-xl font-medium text-gray-800 mb-2">Welcome back!</h3>
                     <p className="text-gray-600">Here's a quick overview of the library status.</p>
                     <p className="mt-4 text-sm text-indigo-600">Your role: <strong className="font-semibold">{isLoading ? <Skeleton width={60} inline/> : role || 'N/A'}</strong></p>
                </motion.div>

                {/* Stats Cards Grid */}
                <motion.div variants={sectionVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatCard index={1} icon={BookOpenIcon} title="Total Books" value={stats.totalBooks} bgColor="bg-gradient-to-br from-blue-500 to-indigo-600" isLoading={isLoading} />
                    <StatCard index={2} icon={UsersIcon} title="Active Users" value={stats.activeUsers} bgColor="bg-gradient-to-br from-green-500 to-emerald-600" isLoading={isLoading} />
                    <StatCard index={3} icon={ClockIcon} title="Pending Approvals" value={stats.pendingApprovals} bgColor="bg-gradient-to-br from-amber-500 to-orange-600" isLoading={isLoading} />
                    <StatCard index={4} icon={ArrowUpOnSquareIcon} title="Books on Loan" value={stats.booksOnLoan} bgColor="bg-gradient-to-br from-purple-500 to-violet-600" isLoading={isLoading} />
                </motion.div>

                 {/* Charts and Recent Activity Grid */}
                 <motion.div variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                     {/* Books Added Chart */}
                     <motion.div variants={cardVariants} className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                         <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                             <PresentationChartLineIcon className="h-5 w-5 mr-2 text-indigo-600" />
                             Books Added Over Time (Demo Data) {/* Update Title if using real data */}
                         </h3>
                         {isLoading ? ( <Skeleton height={300} borderRadius="0.5rem"/> ) : (
                             <ResponsiveContainer width="100%" height={300}>
                                 <LineChart data={booksAddedChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                     {/* ... LineChart components ... */}
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                                      <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '4px' }} />
                                      <Legend wrapperStyle={{ fontSize: '12px' }}/>
                                      <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 6 }} name="Books Added" />
                                 </LineChart>
                             </ResponsiveContainer>
                         )}
                     </motion.div>

                     {/* Recent Activity Feed */}
                     <motion.div variants={cardVariants} className="lg:col-span-1 bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                         <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                             <ListBulletIcon className="h-5 w-5 mr-2 text-indigo-600" />
                             Recent Activity
                         </h3>
                         {isLoading ? ( <Skeleton count={5} height={40} borderRadius="0.375rem" containerClassName="space-y-3"/> ) : (
                             <ul className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {recentLogs.length > 0 ? recentLogs.map((log) => (
                                    <li key={log.id} className="py-3">
                                        <p className="text-sm font-medium text-gray-800 truncate" title={log.description}>{log.description}</p>
                                        <p className="text-xs text-gray-500"> By: <span className="font-medium">{log.user}</span> - {log.time} [{log.action}] </p>
                                    </li>
                                 )) : ( <p className="text-sm text-gray-500 text-center py-4">No recent activity logged.</p> )}
                             </ul>
                         )}
                     </motion.div>

                     {/* Book Status Pie Chart */}
                     <motion.div variants={cardVariants} className="lg:col-span-1 bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <ChartPieIcon className="h-5 w-5 mr-2 text-indigo-600" />
                            Books by Status
                        </h3>
                         {isLoading ? ( <Skeleton height={300} borderRadius="0.5rem"/> ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={bookStatusChartData} cx="50%" cy="50%"
                                        labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value"
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        fontSize={12}
                                    >
                                        {bookStatusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, name]}/>
                                     <Legend wrapperStyle={{ fontSize: '12px' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                         )}
                     </motion.div>

                 </motion.div> {/* End Charts/Activity Grid */}

            </motion.div> // End Main Container
        </SkeletonTheme>
    );
};

export default Dashboard;