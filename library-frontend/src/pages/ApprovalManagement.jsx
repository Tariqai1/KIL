import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// --- Icons ---
import { 
    CheckCircleIcon, XCircleIcon, ClockIcon, MagnifyingGlassIcon, 
    ArrowPathIcon, CalendarIcon, UserIcon, EyeIcon, XMarkIcon, 
    DocumentTextIcon, ExclamationTriangleIcon, DocumentCheckIcon,
    ArrowTopRightOnSquareIcon 
} from '@heroicons/react/24/outline';

// --- API Service ---
import { approvalService } from '../api/approvalService';

// --- CSS ---
import '../assets/css/ManagementPages.css'; 
import '../assets/css/ApprovalManagement.css';

// --- Constants ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ✅ FIXED: Hybrid URL Generator (Works for Cloudinary & Local)
const getStaticUrl = (relativePath) => {
    if (!relativePath) return null;
    
    // Ensure path is a string
    const pathStr = String(relativePath);

    // 1. If it's already a full URL (Cloudinary), return as is
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
        return pathStr;
    }

    // 2. Handle Windows paths (Convert \ to /)
    const normalizedPath = pathStr.replace(/\\/g, '/');
    
    // 3. If path contains '/static/', extract relative part for backend
    if (normalizedPath.includes('/static/')) {
        const parts = normalizedPath.split('/static/');
        return `${API_BASE_URL}/static/${parts[1]}`;
    }

    // 4. Default Local Handling
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${API_BASE_URL}${cleanPath}`;
};

// --- Helper Components ---

const StatusBadge = ({ status }) => {
    const configs = {
        Approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircleIcon },
        Rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircleIcon },
        Pending:  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: ClockIcon },
    };
    const config = configs[status] || configs.Pending;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
            <Icon className="w-3.5 h-3.5 mr-1.5" />
            {status}
        </span>
    );
};

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-black text-slate-800">{value}</h3>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

const ApprovalManagement = () => {
    // --- State ---
    const [allRequests, setAllRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
    
    // Actions
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectionRemarks, setRejectionRemarks] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [previewBook, setPreviewBook] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // --- Data Fetching ---
    const fetchRequests = useCallback(async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        try {
            const data = await approvalService.getAllUploadRequests(); 
            setAllRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Failed to load requests.");
            setAllRequests([]);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // --- Derived Data ---
    const pendingRequests = useMemo(() => allRequests.filter(req => req.status === 'Pending'), [allRequests]);
    const historyRequests = useMemo(() => allRequests.filter(req => req.status !== 'Pending'), [allRequests]);

    const displayData = useMemo(() => {
        const source = activeTab === 'pending' ? pendingRequests : historyRequests;
        if (!searchTerm) return source;
        const lower = searchTerm.toLowerCase();
        return source.filter(req => 
            req.book?.title?.toLowerCase().includes(lower) ||
            req.submitted_by?.username?.toLowerCase().includes(lower)
        );
    }, [activeTab, pendingRequests, historyRequests, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return displayData.slice(start, start + itemsPerPage);
    }, [displayData, currentPage]);

    const totalPages = Math.ceil(displayData.length / itemsPerPage);

    // --- Actions ---
    const handleAction = async (id, status, remarks) => {
        const originalState = [...allRequests];
        
        // Optimistic UI Update
        setAllRequests(prev => prev.map(req => 
            req.id === id 
                ? { ...req, status: status, remarks: remarks, reviewed_at: new Date().toISOString(), reviewed_by: { username: 'You' } } 
                : req
        ));

        // Reset UI
        setRejectingId(null);
        setRejectionRemarks('');
        setPreviewBook(null);
        setActionLoadingId(id);

        try {
            await approvalService.reviewUploadRequest(id, status, remarks);
            toast.success(`Request ${status}`);
            fetchRequests(true); // Sync with backend
        } catch (err) {
            setAllRequests(originalState); // Revert on fail
            toast.error("Action failed. Please try again.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // --- RENDERERS ---

    // 1. Pending Card
    const renderPendingCard = (request) => (
        <motion.div 
            layout 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            key={request.id} 
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
        >
            <div className="flex h-full">
                {/* Thumbnail */}
                <div 
                    className="w-32 bg-slate-100 relative cursor-pointer group-hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewBook(request)}
                >
                    <img 
                        src={getStaticUrl(request.book?.cover_image_url) || "https://via.placeholder.com/150"} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = "https://via.placeholder.com/150?text=No+Img"}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <EyeIcon className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-slate-800 line-clamp-1" title={request.book?.title}>
                                {request.book?.title || "Untitled Book"}
                            </h3>
                            <StatusBadge status="Pending" />
                        </div>
                        
                        <div className="space-y-1 mb-4">
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <UserIcon className="w-3.5 h-3.5" /> 
                                Uploaded by <span className="font-bold text-slate-700">{request.submitted_by?.username}</span>
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5" /> 
                                {new Date(request.submitted_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                        {rejectingId === request.id ? (
                            <div className="flex-1 flex gap-2 animate-in fade-in slide-in-from-right-2">
                                <input 
                                    type="text" 
                                    placeholder="Reason..." 
                                    className="flex-1 text-xs border border-red-200 rounded-lg px-2 focus:outline-none focus:border-red-500"
                                    value={rejectionRemarks}
                                    onChange={(e) => setRejectionRemarks(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={() => handleAction(request.id, 'Rejected', rejectionRemarks)} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg">Confirm</button>
                                <button onClick={() => setRejectingId(null)} className="px-2 py-1.5 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={() => setRejectingId(request.id)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                >
                                    Reject
                                </button>
                                <button 
                                    onClick={() => handleAction(request.id, 'Approved', 'Approved via Panel')}
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1"
                                >
                                    {actionLoadingId === request.id ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
                                    Approve
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans text-slate-800">
            <Toaster position="top-right" />

            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* 1. Header & Stats */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Approvals</h1>
                            <p className="text-slate-500 font-medium">Review and manage book submission requests</p>
                        </div>
                        <button onClick={() => fetchRequests()} className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard title="Pending Review" value={pendingRequests.length} icon={ClockIcon} colorClass="bg-amber-500 text-amber-500" />
                        <StatCard title="Total Approved" value={allRequests.filter(r => r.status === 'Approved').length} icon={CheckCircleIcon} colorClass="bg-emerald-500 text-emerald-500" />
                        <StatCard title="Total Rejected" value={allRequests.filter(r => r.status === 'Rejected').length} icon={XCircleIcon} colorClass="bg-red-500 text-red-500" />
                    </div>
                </div>

                {/* 2. Controls & Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button 
                            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Pending <span className="ml-1 opacity-60 text-xs">({pendingRequests.length})</span>
                        </button>
                        <button 
                            onClick={() => { setActiveTab('history'); setCurrentPage(1); }}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            History <span className="ml-1 opacity-60 text-xs">({historyRequests.length})</span>
                        </button>
                    </div>

                    <div className="relative w-full md:w-64">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search books or users..." 
                            className="w-full pl-9 pr-4 py-2 bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* 3. Content Area */}
                <div className="min-h-[400px]">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            {Array(4).fill(0).map((_, i) => <Skeleton key={i} height={160} borderRadius={16} />)}
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {activeTab === 'pending' ? (
                                displayData.length === 0 ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                        <DocumentCheckIcon className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-slate-800">All Caught Up!</h3>
                                        <p className="text-slate-500">No pending requests at the moment.</p>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="pending-grid"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        {paginatedData.map(renderPendingCard)}
                                    </motion.div>
                                )
                            ) : (
                                <motion.div 
                                    key="history-table"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                                >
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Book Title</th>
                                                <th className="px-6 py-4">Submitted By</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Reviewed By</th>
                                                <th className="px-6 py-4">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {paginatedData.map((req) => (
                                                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-700">{req.book?.title}</td>
                                                    <td className="px-6 py-4 text-slate-500">{req.submitted_by?.username}</td>
                                                    <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                                                    <td className="px-6 py-4 text-slate-500">
                                                        {req.reviewed_by?.username || req.reviewed_by?.full_name || "System"}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                                        {new Date(req.reviewed_at || req.submitted_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {paginatedData.length === 0 && (
                                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">No records found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-8 gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 border rounded-lg text-sm font-bold disabled:opacity-50">Prev</button>
                            <span className="px-4 py-2 text-sm font-medium text-slate-500">Page {currentPage} of {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 border rounded-lg text-sm font-bold disabled:opacity-50">Next</button>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Preview Modal (Updated for Cloudinary) */}
            <AnimatePresence>
                {previewBook && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
                                    Reviewing: {previewBook.book?.title}
                                </h3>
                                <div className="flex gap-2">
                                    {/* ✅ Added Safety Button: Open in New Tab if iframe fails */}
                                    {getStaticUrl(previewBook.book?.pdf_file || previewBook.book?.pdf_url) && (
                                        <a 
                                            href={getStaticUrl(previewBook.book?.pdf_file || previewBook.book?.pdf_url)} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 flex items-center gap-1 text-xs font-bold"
                                            title="Open PDF in new tab"
                                        >
                                            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                                            Open PDF
                                        </a>
                                    )}
                                    <button onClick={() => setPreviewBook(null)} className="p-2 hover:bg-slate-200 rounded-full"><XMarkIcon className="w-5 h-5 text-slate-500" /></button>
                                </div>
                            </div>
                            
                            <div className="flex-1 bg-slate-200 relative">
                                {getStaticUrl(previewBook.book?.pdf_file || previewBook.book?.pdf_url) ? (
                                    <iframe 
                                        src={getStaticUrl(previewBook.book?.pdf_file || previewBook.book?.pdf_url)} 
                                        className="w-full h-full" 
                                        title="PDF Preview"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                                        <ExclamationTriangleIcon className="w-6 h-6" /> PDF Not Available
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                                <button onClick={() => handleAction(previewBook.id, 'Rejected', 'Rejected from preview')} className="px-5 py-2.5 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50">Reject</button>
                                <button onClick={() => handleAction(previewBook.id, 'Approved', 'Approved from preview')} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg">Approve Content</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ApprovalManagement;