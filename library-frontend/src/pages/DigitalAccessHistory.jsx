// src/pages/DigitalAccessHistory.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { digitalAccessService } from '../api/digitalAccessService';
import { userService } from '../api/userService';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { 
    ClockIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    UserIcon, 
    BookOpenIcon, 
    MagnifyingGlassIcon,
    ArrowPathIcon
} from '@heroicons/react/20/solid';
import '../assets/css/ManagementPages.css'; 

// --- Helper: Status Badge ---
const AccessBadge = ({ granted }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${granted ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
        {granted ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
        {granted ? 'Access Granted' : 'Access Denied'}
    </span>
);

const DigitalAccessHistory = () => {
    // --- State ---
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState({ users: true, history: false });
    const [error, setError] = useState(null);
    
    // Search & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // --- Fetch Users ---
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const data = await userService.getAllUsers();
                setUsers(data || []);
            } catch (err) {
                setError("Failed to load user list.");
            } finally {
                setLoading(prev => ({ ...prev, users: false }));
            }
        };
        loadUsers();
    }, []);

    // --- Fetch History ---
    const fetchHistory = useCallback(async () => {
        if (!selectedUserId) {
            setHistory([]);
            return;
        }
        setLoading(prev => ({ ...prev, history: true }));
        setError(null);
        try {
            const data = await digitalAccessService.getAccessHistoryForUser(parseInt(selectedUserId));
            setHistory(data || []);
            setCurrentPage(1); // Reset to page 1 on new user selection
        } catch (err) {
            setError(`Could not fetch logs for user ID ${selectedUserId}.`);
            setHistory([]);
        } finally {
            setLoading(prev => ({ ...prev, history: false }));
        }
    }, [selectedUserId]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        if (!history.length) return null;
        const total = history.length;
        const success = history.filter(h => h.access_granted).length;
        const denied = total - success;
        const successRate = Math.round((success / total) * 100);
        return { total, success, denied, successRate };
    }, [history]);

    // --- Filtering & Pagination ---
    const filteredHistory = useMemo(() => {
        return history.filter(log => 
            log.book?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.id?.toString().includes(searchTerm)
        );
    }, [history, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredHistory.slice(start, start + itemsPerPage);
    }, [filteredHistory, currentPage]);

    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

    // --- Styles ---
    const cardClass = "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm";
    const inputClass = "w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all bg-slate-50 focus:bg-white";

    return (
        <SkeletonTheme baseColor="#f3f4f6" highlightColor="#ffffff">
            <div className="management-container p-6 max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                            <ClockIcon className="h-8 w-8 text-indigo-600" /> Digital Access Logs
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Audit and track digital content consumption per user.</p>
                    </div>
                    {/* User Select Dropdown */}
                    <div className="w-full md:w-72">
                        {loading.users ? <Skeleton height={40} /> : (
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <select 
                                    className={`${inputClass} pl-10`}
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    disabled={loading.history}
                                >
                                    <option value="">-- Select User to Inspect --</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.username} ({u.full_name})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">{error}</div>}

                {/* Dashboard Stats (Only show if user selected) */}
                {selectedUserId && stats && !loading.history && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className={`${cardClass} border-l-4 border-l-indigo-500`}>
                            <p className="text-xs font-bold text-slate-400 uppercase">Total Attempts</p>
                            <p className="text-2xl font-black text-slate-800">{stats.total}</p>
                        </div>
                        <div className={`${cardClass} border-l-4 border-l-emerald-500`}>
                            <p className="text-xs font-bold text-slate-400 uppercase">Access Granted</p>
                            <p className="text-2xl font-black text-emerald-600">{stats.success}</p>
                        </div>
                        <div className={`${cardClass} border-l-4 border-l-rose-500`}>
                            <p className="text-xs font-bold text-slate-400 uppercase">Access Denied</p>
                            <p className="text-2xl font-black text-rose-600">{stats.denied}</p>
                        </div>
                        <div className={`${cardClass} border-l-4 border-l-amber-500`}>
                            <p className="text-xs font-bold text-slate-400 uppercase">Success Rate</p>
                            <p className="text-2xl font-black text-amber-600">{stats.successRate}%</p>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                    
                    {/* Toolbar */}
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                        <h3 className="font-bold text-slate-700">Detailed Logs</h3>
                        {selectedUserId && (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <div className="relative flex-grow">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search books..." 
                                        className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-full"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button onClick={fetchHistory} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600">
                                    <ArrowPathIcon className={`h-5 w-5 ${loading.history ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Table View */}
                    <div className="relative">
                        {!selectedUserId ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <UserIcon className="h-16 w-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium">Select a user to view access history</p>
                            </div>
                        ) : loading.history ? (
                            <div className="p-6"><Skeleton count={5} height={50} className="mb-2" /></div>
                        ) : filteredHistory.length === 0 ? (
                            <div className="py-20 text-center text-slate-500">
                                <p>No records found for this criteria.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                                            <tr>
                                                <th className="px-6 py-4">Time</th>
                                                <th className="px-6 py-4">Book Details</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-right">Log ID</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {paginatedData.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                        {new Date(log.access_timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Link to={`/books/${log.book?.id}`} className="font-bold text-slate-800 hover:text-indigo-600 transition-colors flex items-center gap-2">
                                                            <BookOpenIcon className="h-4 w-4 text-slate-400" />
                                                            {log.book?.title || 'Unknown Book'}
                                                        </Link>
                                                        <span className="text-xs text-slate-400 block mt-0.5 ml-6">ISBN: {log.book?.isbn || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <AccessBadge granted={log.access_granted} />
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-xs font-mono text-slate-400">
                                                        #{log.id}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
                                        <button 
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                                        >Previous</button>
                                        <span className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button 
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                                        >Next</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </SkeletonTheme>
    );
};

export default DigitalAccessHistory;