import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; // Ensure this hook provides permissions
import toast from 'react-hot-toast';

// --- Services ---
import { bookService } from '../api/bookService';
import { userService } from '../api/userService';
import restrictedBookService from "../api/restrictedBookService";

import { copyIssueService } from '../api/copyIssueService';
import { logService } from '../api/logService';

// --- Icons ---
import {
    BookOpenIcon, UsersIcon, ClockIcon, ArrowUpOnSquareIcon,
    ListBulletIcon, PresentationChartLineIcon, ChartPieIcon, ArrowPathIcon,
    ShieldCheckIcon, PlusCircleIcon, QueueListIcon, CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

// --- Charts ---
import {
    LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

// --- Loading Skeleton ---
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// --- Animation Config ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ==========================================
// 1. HELPER COMPONENTS
// ==========================================

const StatCard = ({ icon: Icon, title, value, subtext, colorClass, loading, onClick, delay }) => (
    <motion.div
        variants={itemVariants}
        whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        onClick={onClick}
        className={`relative overflow-hidden p-6 rounded-2xl border border-slate-100 bg-white cursor-pointer transition-all group`}
    >
        {/* Abstract Background Shape */}
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${colorClass.bgShape}`}></div>
        
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
                {loading ? (
                    <Skeleton width={80} height={36} />
                ) : (
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
                )}
                {subtext && <p className={`text-xs mt-2 font-semibold ${colorClass.subtext}`}>{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl shadow-sm ${colorClass.bg} ${colorClass.text}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </motion.div>
);

const QuickAction = ({ to, icon: Icon, label, color, permission, userPermissions, role }) => {
    // Permission Check
    const hasAccess = !permission || 
                      role === 'admin' || 
                      role === 'superadmin' || 
                      userPermissions?.includes(permission);

    if (!hasAccess) return null;

    return (
        <Link to={to} className="group flex flex-col items-center justify-center p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
            <div className={`p-3.5 rounded-full ${color} text-white mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-md`}>
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 uppercase tracking-wide text-center">{label}</span>
        </Link>
    );
};

// ==========================================
// 2. MAIN DASHBOARD COMPONENT
// ==========================================

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Auth & Permissions
    const role = user?.role?.name?.toLowerCase() || user?.role?.toLowerCase() || '';
    const permissions = user?.permissions || [];

    // --- State ---
    const [stats, setStats] = useState({
        totalBooks: 0,
        activeUsers: 0,
        pendingRequests: 0,
        booksOnLoan: 0,
        totalCopies: 0
    });
    
    const [chartData, setChartData] = useState({ added: [], status: [] });
    const [recentLogs, setRecentLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    // --- Permission Helper ---
    const hasPermission = (perm) => {
        if (role === 'admin' || role === 'superadmin') return true;
        return permissions.includes(perm);
    };

    // --- Fetch Logic ---
    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        const loadStartTime = Date.now();

        try {
            // Define promises based on permissions to save bandwidth
            const promises = [
                hasPermission('BOOK_VIEW') ? bookService.getAllBooks(false) : Promise.resolve([]),
                hasPermission('USER_VIEW') ? userService.getAllUsers() : Promise.resolve([]),
                hasPermission('REQUEST_VIEW') ? restrictedBookService.getAllRequests() : Promise.resolve([]),
                hasPermission('BOOK_ISSUE') ? copyIssueService.getAllIssues() : Promise.resolve([]),
                hasPermission('LOGS_VIEW') ? logService.getRecentLogs(5) : Promise.resolve([])
            ];

            const results = await Promise.allSettled(promises);

            // Helper to safely get value
            const getValue = (idx) => (results[idx].status === 'fulfilled' ? results[idx].value : []);

            const books = getValue(0);
            const users = getValue(1);
            const requests = getValue(2);
            const issues = getValue(3);
            const logs = getValue(4);

            // 1. Process Stats
            setStats({
                totalBooks: books.length,
                activeUsers: users.filter(u => u.status !== 'banned' && u.status !== 'Deleted').length,
                pendingRequests: requests.filter(r => r.status === 'pending').length,
                booksOnLoan: issues.filter(i => i.status === 'issued').length
            });

            // 2. Process Line Chart (Growth)
            const monthlyData = Array(12).fill(0);
            books.forEach(book => {
                if (book.created_at) {
                    const d = new Date(book.created_at);
                    if (!isNaN(d.getTime())) monthlyData[d.getMonth()]++;
                }
            });
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const lineData = months.map((m, i) => ({ name: m, books: monthlyData[i] }));

            // 3. Process Pie Chart (Requests)
            const approved = requests.filter(r => r.status === 'approved').length;
            const pending = requests.filter(r => r.status === 'pending').length;
            const rejected = requests.filter(r => r.status === 'rejected').length;

            setChartData({
                added: lineData,
                status: [
                    { name: 'Approved', value: approved, color: '#10B981' },
                    { name: 'Pending', value: pending, color: '#F59E0B' },
                    { name: 'Rejected', value: rejected, color: '#EF4444' }
                ]
            });

            // 4. Logs
            setRecentLogs(logs);
            setLastUpdated(new Date());

        } catch (err) {
            console.error("Dashboard Load Error:", err);
            toast.error("Partial data load failed.");
        } finally {
            // Min loading time for smooth UX
            const elapsed = Date.now() - loadStartTime;
            if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
            setIsLoading(false);
        }
    }, [role, permissions]); // Dependency on role/perms

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // --- Chart Colors ---
    const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

    return (
        <SkeletonTheme baseColor="#f1f5f9" highlightColor="#e2e8f0">
            <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="visible"
                className="p-4 md:p-8 space-y-8 bg-[#f8fafc] min-h-screen font-sans"
            >
                {/* --- Header --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Overview</h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Welcome back, <span className="text-indigo-600 font-bold">{user?.username || 'Admin'}</span>.
                            {lastUpdated && <span className="text-xs ml-2 text-slate-400 font-normal">Updated: {lastUpdated.toLocaleTimeString()}</span>}
                        </p>
                    </div>
                    <button 
                        onClick={fetchDashboardData} 
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm font-bold text-sm active:scale-95 disabled:opacity-50"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                </div>

                {/* --- 1. Stats Grid (Dynamic Permissions) --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Everyone sees Total Books */}
                    <StatCard 
                        icon={BookOpenIcon} title="Library Collection" value={stats.totalBooks} subtext="Total Books Available"
                        colorClass={{ bg: 'bg-indigo-50 text-indigo-600', subtext: 'text-indigo-500', bgShape: 'bg-indigo-500' }}
                        loading={isLoading} onClick={() => navigate('/admin/books')}
                    />

                    {/* Access Requests (Only if permitted) */}
                    {hasPermission('REQUEST_VIEW') && (
                        <StatCard 
                            icon={ShieldCheckIcon} title="Access Requests" value={stats.pendingRequests} subtext="Pending Approval"
                            colorClass={{ bg: 'bg-amber-50 text-amber-600', subtext: 'text-amber-500', bgShape: 'bg-amber-500' }}
                            loading={isLoading} onClick={() => navigate('/admin/access-requests')}
                        />
                    )}

                    {/* Active Loans (Only if permitted) */}
                    {hasPermission('BOOK_ISSUE') && (
                        <StatCard 
                            icon={ArrowUpOnSquareIcon} title="Circulation" value={stats.booksOnLoan} subtext="Books Currently Issued"
                            colorClass={{ bg: 'bg-purple-50 text-purple-600', subtext: 'text-purple-500', bgShape: 'bg-purple-500' }}
                            loading={isLoading} onClick={() => navigate('/admin/copies')}
                        />
                    )}

                    {/* Total Users (Only if permitted) */}
                    {hasPermission('USER_VIEW') && (
                        <StatCard 
                            icon={UsersIcon} title="User Base" value={stats.activeUsers} subtext="Active Accounts"
                            colorClass={{ bg: 'bg-emerald-50 text-emerald-600', subtext: 'text-emerald-500', bgShape: 'bg-emerald-500' }}
                            loading={isLoading} onClick={() => navigate('/admin/users')}
                        />
                    )}
                </div>

                {/* --- 2. Quick Actions --- */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <QuickAction to="/admin/books/add" icon={PlusCircleIcon} label="Add Book" color="bg-indigo-600" permission="BOOK_MANAGE" role={role} userPermissions={permissions} />
                        <QuickAction to="/admin/access-requests" icon={ShieldCheckIcon} label="Approvals" color="bg-amber-500" permission="REQUEST_MANAGE" role={role} userPermissions={permissions} />
                        <QuickAction to="/admin/copies" icon={QueueListIcon} label="Issue Book" color="bg-purple-600" permission="BOOK_ISSUE" role={role} userPermissions={permissions} />
                        <QuickAction to="/admin/logs" icon={ListBulletIcon} label="System Logs" color="bg-slate-600" permission="LOGS_VIEW" role={role} userPermissions={permissions} />
                    </div>
                </motion.div>

                {/* --- 3. Analytics & Charts --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Line Chart */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <PresentationChartLineIcon className="w-5 h-5 text-indigo-500" />
                                Collection Growth
                            </h3>
                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold">This Year</span>
                        </div>
                        <div className="h-[300px] w-full">
                            {isLoading ? <Skeleton height="100%" /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData.added}>
                                        <defs>
                                            <linearGradient id="colorBooks" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                        <Area type="monotone" dataKey="books" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBooks)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </motion.div>

                    {/* Pie Chart (Conditional Render if Permitted) */}
                    {hasPermission('REQUEST_VIEW') && (
                        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                                <ChartPieIcon className="w-5 h-5 text-emerald-500" />
                                Request Distribution
                            </h3>
                            <div className="flex-1 min-h-[250px] relative">
                                {isLoading ? <Skeleton height="100%" /> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData.status}
                                                innerRadius={65}
                                                outerRadius={85}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.status.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                                {/* Center Text Overlay */}
                                {!isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none pb-8">
                                        <span className="text-3xl font-black text-slate-800">
                                            {chartData.status.reduce((a, b) => a + b.value, 0)}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* --- 4. Recent Logs (Conditional) --- */}
                {hasPermission('LOGS_VIEW') && (
                    <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <ListBulletIcon className="w-5 h-5 text-slate-500" />
                                Recent System Activity
                            </h3>
                            <Link to="/admin/logs" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View All</Link>
                        </div>
                        <div className="p-0">
                            {isLoading ? (
                                <div className="p-6"><Skeleton count={3} height={50} /></div>
                            ) : recentLogs.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {recentLogs.map((log) => (
                                        <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                                            <div className="mt-1 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px] tracking-wide border border-slate-200 uppercase">
                                                {log.action_type ? log.action_type.substring(0, 2) : 'SY'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-slate-700">{log.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                                        {log.action_by?.username || 'System'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <ClockIcon className="w-12 h-12 text-slate-200 mb-2" />
                                    <p className="text-slate-400 font-medium">No recent activity found.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </SkeletonTheme>
    );
};

export default Dashboard;