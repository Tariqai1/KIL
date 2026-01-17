// src/pages/ApprovalManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { approvalService } from '../api/approvalService';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, ClockIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/20/solid';
// Import a placeholder icon
import { BookOpenIcon } from '@heroicons/react/24/outline'; 
// Make sure these CSS files exist at these paths
import '../assets/css/ManagementPages.css'; 
import '../assets/css/ApprovalManagement.css'; 

// Helper to get full URL
const getStaticUrl = (relativePath) => {
    if (!relativePath) return null;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    return `${baseUrl}${relativePath}`;
};

// Animation Variants
const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } }
};
const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } },
    exit: { opacity: 0, y: -5, transition: { duration: 0.15, ease: 'easeIn' } }
};

// Simple Spinner Icon Component
const SpinnerIcon = () => (
     <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
     </svg>
);
// Placeholder icon for missing cover image
const PlaceholderBookIcon = ({className}) => (
    <BookOpenIcon className={className} />
);


const ApprovalManagement = () => {
    // --- State ---
    // *** YAHAN FIX HAI: Sabhi ko [] se initialize kiya gaya hai ***
    const [allRequests, setAllRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [rejectingRequest, setRejectingRequest] = useState(null);
    const [rejectionRemarks, setRejectionRemarks] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [reviewedSearchTerm, setReviewedSearchTerm] = useState('');
    const [reviewedCurrentPage, setReviewedCurrentPage] = useState(1);
    const [reviewedItemsPerPage] = useState(10);

    // --- Data Fetching ---
    // YEH AAPKA SAHI FUNCTION NAAM HAI: 'fetchRequests'
    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setRejectingRequest(null);
        try {
            const data = await approvalService.getAllRequests();
            setAllRequests(data || []); // Ensure it's always an array
        } catch (err) {
            setError(err.detail || 'Could not fetch approval requests.');
            setAllRequests([]); // Set to empty array on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // --- Derive Lists (Safe with || []) ---
    const pendingRequests = useMemo(() =>
        (allRequests || []).filter(req => req.status === 'Pending'),
        [allRequests]
    );

    const filteredReviewedRequests = useMemo(() => {
        const reviewed = (allRequests || []).filter(req => req.status !== 'Pending');
        if (!reviewedSearchTerm) {
            return reviewed;
        }
        const lowerSearch = reviewedSearchTerm.toLowerCase();
        return reviewed.filter(req =>
            (req.book?.title && req.book.title.toLowerCase().includes(lowerSearch)) ||
            (req.submitted_by?.username && req.submitted_by.username.toLowerCase().includes(lowerSearch)) ||
            (req.reviewed_by?.username && req.reviewed_by.username.toLowerCase().includes(lowerSearch)) ||
            (req.status && req.status.toLowerCase().includes(lowerSearch)) ||
            (req.remarks && req.remarks.toLowerCase().includes(lowerSearch))
        );
    }, [allRequests, reviewedSearchTerm]);

    // --- Pagination Logic (Safe with .length) ---
    const paginatedReviewedRequests = useMemo(() => {
        const startIndex = (reviewedCurrentPage - 1) * reviewedItemsPerPage;
        return filteredReviewedRequests.slice(startIndex, startIndex + reviewedItemsPerPage);
    }, [filteredReviewedRequests, reviewedCurrentPage, reviewedItemsPerPage]);

    const reviewedTotalPages = useMemo(() => {
        return Math.ceil(filteredReviewedRequests.length / reviewedItemsPerPage);
    }, [filteredReviewedRequests, reviewedItemsPerPage]);

    useEffect(() => {
        setReviewedCurrentPage(1);
    }, [reviewedSearchTerm]);
    
    const goToNextReviewedPage = () => {
        setReviewedCurrentPage((prev) => Math.min(prev + 1, reviewedTotalPages));
    };
    const goToPreviousReviewedPage = () => {
        setReviewedCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    // --- Action Handlers ---
    const handleApprove = async (requestId) => {
        setActionLoading(requestId); setError(null);
        try {
            await approvalService.reviewRequest(requestId, 'Approved', 'Approved via Admin Panel');
            fetchRequests();
        } catch (err) { setError(err.detail || `Failed to approve request ${requestId}.`); }
        finally { setActionLoading(null); }
    };

    const handleRejectClick = (request) => {
        setRejectingRequest(request);
        setRejectionRemarks('');
    };

    const handleConfirmReject = async (e) => {
        e.preventDefault(); if (!rejectingRequest) return;
        setActionLoading(rejectingRequest.id); setError(null);
        try {
            await approvalService.reviewRequest(rejectingRequest.id, 'Rejected', rejectionRemarks);
            setRejectingRequest(null);
            fetchRequests();
        } catch (err) { setError(err.detail || `Failed to reject request ${rejectingRequest.id}.`); }
        finally { setActionLoading(null); }
    };

    // --- Render Functions ---
    const renderRequestCard = (request) => {
        const book = request.book;
        const submittedBy = request.submitted_by;
        const coverImageUrl = getStaticUrl(book?.cover_image_url);
        const isBeingRejected = rejectingRequest?.id === request.id;
        const isCurrentActionLoading = actionLoading === request.id;

        return (
            <motion.div key={request.id} layout variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col sm:flex-row">
                <div className="flex-shrink-0 w-full sm:w-32 h-48 sm:h-auto bg-gray-100 flex items-center justify-center">
                    {coverImageUrl ? <img src={coverImageUrl} alt={`Cover for ${book?.title}`} className="w-full h-full object-cover" /> : <PlaceholderBookIcon className="h-16 w-16 text-gray-400" />}
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                        <h4 className="font-semibold text-lg text-gray-800 mb-1 hover:text-indigo-600"><Link to={`/books/${book?.id}`}>{book?.title || 'Unknown Title'}</Link><span className="text-xs text-gray-500 ml-1"> (ID: {book?.id})</span></h4>
                        <p className="text-sm text-gray-600 mb-1">Author: {book?.author || 'N/A'}</p><p className="text-sm text-gray-600 mb-3">ISBN: {book?.isbn || 'N/A'}</p>
                        <p className="text-xs text-gray-500">Submitted By: {submittedBy?.username || 'N/A'} on {new Date(request.submitted_at).toLocaleDateString()} (Req ID: {request.id})</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        {isBeingRejected ? (
                            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleConfirmReject} className="space-y-2">
                                <label htmlFor={`remarks-${request.id}`} className="block text-xs font-medium text-gray-600">Reason (Optional):</label>
                                <textarea id={`remarks-${request.id}`} value={rejectionRemarks} onChange={(e) => setRejectionRemarks(e.target.value)} rows="2" disabled={isCurrentActionLoading} className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"/>
                                <div className="flex justify-end space-x-2">
                                    <button type="button" onClick={() => setRejectingRequest(null)} disabled={isCurrentActionLoading} className="px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                                    <button type="submit" disabled={isCurrentActionLoading} className="px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center">{isCurrentActionLoading && <SpinnerIcon />} Confirm Reject</button>
                                </div>
                            </motion.form>
                        ) : (
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => handleRejectClick(request)} disabled={isCurrentActionLoading} className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"><XCircleIcon className="-ml-0.5 mr-1 h-4 w-4 text-gray-500" /> Reject</button>
                                <button onClick={() => handleApprove(request.id)} disabled={isCurrentActionLoading} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">{isCurrentActionLoading ? <SpinnerIcon /> : <CheckCircleIcon className="-ml-0.5 mr-1 h-4 w-4" />} Approve</button>
                            </div>
                           )}
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderReviewedRow = (request) => {
        const book = request.book;
        const reviewedBy = request.reviewed_by;
        const statusClass = request.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const StatusIcon = request.status === 'Approved' ? CheckCircleIcon : XCircleIcon;

        return (
            <tr key={request.id} className="bg-white hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{request.id}</td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    <Link to={`/books/${book?.id}`} className="hover:text-indigo-600">{book?.title || 'N/A'}</Link>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                        <StatusIcon className="-ml-0.5 mr-1 h-4 w-4" /> {request.status}
                    </span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-500 max-w-xs break-words">{request.remarks || '-'}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{reviewedBy?.username || 'N/A'}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : 'N/A'}</td>
                 <td className="px-6 py-3 whitespace-nowLrap text-sm text-gray-500">{request.submitted_by?.username || 'N/A'}</td>
            </tr>
        );
    };

    // --- JSX Rendering ---
    return (
        <div className="management-container p-4 md:p-6 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">✅ Approval Management</h2>

            {isLoading && <p className="text-center text-gray-500 py-4">Loading requests...</p>}
            {error && <p className="error-message p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">{error}</p>}

            {/* --- Tabs --- */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'pending' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('pending')}
                        disabled={isLoading}
                    >
                        Pending ({(pendingRequests || []).length}) {/* Safe access */}
                    </button>
                    <button
                         className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'reviewed' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('reviewed')}
                        disabled={isLoading}
                    >
                         {/* Safe access */}
                         Reviewed ({(filteredReviewedRequests || []).length}{reviewedSearchTerm ? ` / ${((allRequests || []).length - (pendingRequests || []).length)}` : ''})
                    </button>
                </nav>
            </div>

            {/* --- Tab Content --- */}
            <div className="mt-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'pending' && (
                        <motion.div key="pending" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="pending-requests-list space-y-4">
                            <h3 className="sr-only">Pending Requests</h3>
                            {!isLoading && (pendingRequests || []).length === 0 && (
                                <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                                    <h4 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h4>
                                    <p className="mt-1 text-sm text-gray-500">No requests are currently pending review.</p>
                                </div>
                            )}
                             <AnimatePresence initial={false}>
                                {(pendingRequests || []).map(renderRequestCard)}
                             </AnimatePresence>
                        </motion.div>
                    )}

                    {activeTab === 'reviewed' && (
                         <motion.div key="reviewed" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="reviewed-requests-list space-y-4">
                            <h3 className="sr-only">Reviewed Requests</h3>
                            <div className="flex justify-between items-center gap-4 mb-4">
                                <div className="relative flex-grow max-w-lg">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400"/></div>
                                    <input type="text" placeholder="Search Reviewed (Title, User, Status...)" value={reviewedSearchTerm} onChange={(e) => setReviewedSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
                                </div>
                                 
                                 {/* * --- YAHAN FIX KIYA GAYA ---
                                  * Aapka error 'fetchData is not defined' yahan se aa raha tha.
                                  * Aapke function ka naam 'fetchRequests' hai.
                                  * Maine onClick={fetchData} ko onClick={fetchRequests} se badal diya hai.
                                 */}
                                 <button 
                                    onClick={fetchRequests} 
                                    disabled={isLoading} 
                                    className="refresh-button inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                                </button>
                            </div>

                            {!isLoading && (filteredReviewedRequests || []).length === 0 && (
                                 <p className="text-center text-gray-500 py-6">{reviewedSearchTerm ? 'No reviewed requests match your search.' : 'No requests have been reviewed yet.'}</p>
                            )}

                            {!isLoading && (filteredReviewedRequests || []).length > 0 && (
                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                                    <div className="table-responsive">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Req#</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed By</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed At</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th></tr></thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {paginatedReviewedRequests.map(renderReviewedRow)}
                                            </tbody>
                                        </table>
                                    </div>
                                    {reviewedTotalPages > 1 && (
                                        <div className="pagination-controls bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                            <div className="flex-1 flex justify-between sm:hidden">
                                                <button onClick={goToPreviousReviewedPage} disabled={reviewedCurrentPage === 1 || isLoading} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"> Previous </button>
                                                <button onClick={goToNextReviewedPage} disabled={reviewedCurrentPage === reviewedTotalPages || isLoading} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"> Next </button>
                                            </div>
                                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                                <div><p className="text-sm text-gray-700">Showing <span className="font-medium">{(reviewedCurrentPage - 1) * reviewedItemsPerPage + 1}</span> to <span className="font-medium">{Math.min(reviewedCurrentPage * reviewedItemsPerPage, filteredReviewedRequests.length)}</span> of <span className="font-medium">{filteredReviewedRequests.length}</span> results</p></div>
                                                <div><nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination"><button onClick={goToPreviousReviewedPage} disabled={reviewedCurrentPage === 1 || isLoading} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Prev</button><button onClick={goToNextReviewedPage} disabled={reviewedCurrentPage === reviewedTotalPages || isLoading} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Next</button></nav></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ApprovalManagement;