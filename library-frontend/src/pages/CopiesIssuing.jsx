// src/pages/CopiesIssuing.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { copyIssueService } from '../api/copyIssueService'; // Assuming this service exists
import { bookService } from '../api/bookService';
import { locationService } from '../api/locationService';
import { userService } from '../api/userService'; // Assuming this service exists
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
// Make sure these CSS files exist at these paths
import '../assets/css/ManagementPages.css';
import '../assets/css/CopiesIssuing.css'; // Optional: for specific styling

// Helper to format date for input (YYYY-MM-DD)
const formatDateForInput = (isoDateStringOrDate) => {
    if (!isoDateStringOrDate) return '';
    try {
        const date = new Date(isoDateStringOrDate);
        // Adjust for timezone offset to get local date correct for input[type=date]
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
        return adjustedDate.toISOString().split('T')[0];
    } catch (e) {
        console.error("Error formatting date:", e);
        return '';
    }
};

// Animation variants
const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -5, transition: { duration: 0.15, ease: 'easeIn' } }
};

const CopiesIssuing = () => {
    // --- State Variables ---
    const [allCopies, setAllCopies] = useState([]);
    const [allIssues, setAllIssues] = useState([]);
    const [books, setBooks] = useState([]); // Will contain ALL books now
    const [locations, setLocations] = useState([]);
    const [users, setUsers] = useState([]);

    // --- UI States ---
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // For critical data load errors
    const [actionError, setActionError] = useState(null); // For form submission errors
    const [successMessage, setSuccessMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('copies'); // Default tab

    // --- Form States ---
    const [newCopyData, setNewCopyData] = useState({ book_id: '', location_id: '' });
    const [issueData, setIssueData] = useState({ copy_id: '', client_id: '', due_date: '' });
    const [returnIssueId, setReturnIssueId] = useState(''); // Stores the ID of the issue record to return

    // --- Search & Pagination States ---
    const [copySearchTerm, setCopySearchTerm] = useState('');
    const [copyCurrentPage, setCopyCurrentPage] = useState(1);
    const [copyItemsPerPage] = useState(10);
    const [issueSearchTerm, setIssueSearchTerm] = useState('');
    const [issueCurrentPage, setIssueCurrentPage] = useState(1);
    const [issueItemsPerPage] = useState(10);

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setActionError(null);
        setSuccessMessage(null);
        try {
            // Fetch all data concurrently, handle individual errors
            const [copiesRes, issuesRes, booksRes, locationsRes, usersRes] = await Promise.allSettled([
                copyIssueService.getAllCopies(),
                copyIssueService.getAllIssues(),
                // --- FIX: Fetch ALL books (approved: false) for the Add Copy dropdown ---
                bookService.getAllBooks(false),
                // --- END FIX ---
                locationService.getAllLocations(),
                userService.getAllUsers()
            ]);

            // Process results, setting state or logging errors
            if (copiesRes.status === 'fulfilled') setAllCopies(copiesRes.value || []);
            else console.error("Failed to load copies:", copiesRes.reason);

            if (issuesRes.status === 'fulfilled') setAllIssues(issuesRes.value || []);
            else console.error("Failed to load issues:", issuesRes.reason);

            if (booksRes.status === 'fulfilled') setBooks(booksRes.value || []);
            else console.error("Failed to load books:", booksRes.reason);

            if (locationsRes.status === 'fulfilled') setLocations(locationsRes.value || []);
            else console.error("Failed to load locations:", locationsRes.reason);

            if (usersRes.status === 'fulfilled') setUsers(usersRes.value || []);
            else console.error("Failed to load users:", usersRes.reason);

            // Set default due date (e.g., two weeks from now)
            const twoWeeksFromNow = new Date();
            twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
            setIssueData(prev => ({ ...prev, due_date: formatDateForInput(twoWeeksFromNow) }));

            // Reset pagination on full refresh
            setCopyCurrentPage(1);
            setIssueCurrentPage(1);

            // Set overall error only if critical data (e.g., copies) failed
            if (copiesRes.status === 'rejected') {
                 setError(copiesRes.reason?.detail || 'Could not fetch book copies.');
            }

        } catch (err) { // Catch unexpected errors during Promise.allSettled itself
            setError('An unexpected error occurred while fetching data.');
            console.error("General fetch data error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array means this useCallback instance is stable

    useEffect(() => {
        fetchData(); // Fetch data on component mount
    }, [fetchData]); // Dependency array includes fetchData

    // --- Filtering & Pagination ---
    // Filter copies based on search term
    const filteredCopies = useMemo(() => {
        if (!copySearchTerm) return allCopies || [];
        const lowerCaseSearch = copySearchTerm.toLowerCase();
        return (allCopies || []).filter(copy =>
            (copy.book?.title?.toLowerCase().includes(lowerCaseSearch)) ||
            (copy.id?.toString().includes(lowerCaseSearch)) ||
            (copy.location?.name?.toLowerCase().includes(lowerCaseSearch)) ||
            (copy.status?.toLowerCase().includes(lowerCaseSearch)) // Search status too
        );
    }, [allCopies, copySearchTerm]);

    // Paginate filtered copies
    const paginatedCopies = useMemo(() => {
        const startIndex = (copyCurrentPage - 1) * copyItemsPerPage;
        return filteredCopies.slice(startIndex, startIndex + copyItemsPerPage);
    }, [filteredCopies, copyCurrentPage, copyItemsPerPage]);

    const copyTotalPages = useMemo(() => Math.ceil(filteredCopies.length / copyItemsPerPage), [filteredCopies, copyItemsPerPage]);
    useEffect(() => { setCopyCurrentPage(1); }, [copySearchTerm]); // Reset page on search
    const goToNextCopyPage = () => setCopyCurrentPage((p) => Math.min(p + 1, copyTotalPages));
    const goToPreviousCopyPage = () => setCopyCurrentPage((p) => Math.max(p - 1, 1));

    // Get currently issued items
    const currentlyIssuedItems = useMemo(() => (allIssues || []).filter(issue => issue.status?.toLowerCase() === 'issued'), [allIssues]); // Use lowercase for safety

    // Filter issued items based on search term
    const filteredIssuedItems = useMemo(() => {
        if (!issueSearchTerm) return currentlyIssuedItems;
        const lowerCaseSearch = issueSearchTerm.toLowerCase();
        return currentlyIssuedItems.filter(issue =>
            issue.id?.toString().includes(lowerCaseSearch) ||
            issue.copy_id?.toString().includes(lowerCaseSearch) ||
            (issue.book_copy?.book?.title?.toLowerCase().includes(lowerCaseSearch)) ||
            (issue.client?.username?.toLowerCase().includes(lowerCaseSearch))
        );
    }, [currentlyIssuedItems, issueSearchTerm]);

    // Paginate filtered issued items
    const paginatedIssuedItems = useMemo(() => {
        const startIndex = (issueCurrentPage - 1) * issueItemsPerPage;
        return filteredIssuedItems.slice(startIndex, startIndex + issueItemsPerPage);
    }, [filteredIssuedItems, issueCurrentPage, issueItemsPerPage]);

    const issueTotalPages = useMemo(() => Math.ceil(filteredIssuedItems.length / issueItemsPerPage), [filteredIssuedItems, issueItemsPerPage]);
    useEffect(() => { setIssueCurrentPage(1); }, [issueSearchTerm]); // Reset page on search
    const goToNextIssuePage = () => setIssueCurrentPage((p) => Math.min(p + 1, issueTotalPages));
    const goToPreviousIssuePage = () => setIssueCurrentPage((p) => Math.max(p - 1, 1));

    // --- Action Handlers ---
    const handleCopyInputChange = (e) => setNewCopyData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleIssueInputChange = (e) => setIssueData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleReturnInputChange = (e) => setReturnIssueId(e.target.value);

    // Add a new book copy
    const handleAddCopy = async (e) => {
        e.preventDefault();
        if (!newCopyData.book_id || !newCopyData.location_id) { setActionError('Please select both a book and a location.'); return; }
        setActionError(null); setSuccessMessage(null); setIsLoading(true); // Indicate loading
        try {
            // Convert IDs to numbers before sending
            await copyIssueService.createCopy({
                book_id: parseInt(newCopyData.book_id),
                location_id: parseInt(newCopyData.location_id)
            });
            setSuccessMessage('Book copy added successfully!');
            setNewCopyData({ book_id: '', location_id: '' }); // Reset form
            fetchData(); // Refresh all data including copies list
        } catch (err) {
            setActionError(err.detail || 'Failed to add book copy.');
            setIsLoading(false); // Stop loading on error
        }
        // setIsLoading(false) will be handled by fetchData's finally block if successful
    };

    // Issue a book copy to a user
    const handleIssueBook = async (e) => {
        e.preventDefault();
        if (!issueData.copy_id || !issueData.client_id || !issueData.due_date) {
            setActionError('Please select an available copy, a user, and set a due date.');
            return;
        }
        setActionError(null); setSuccessMessage(null); setIsLoading(true);
        try {
            const payload = {
                copy_id: parseInt(issueData.copy_id),
                client_id: parseInt(issueData.client_id),
                due_date: issueData.due_date // Already in YYYY-MM-DD format
            };
            await copyIssueService.issueBook(payload);
            setSuccessMessage('Book issued successfully!');
            // Reset form, keep default due date
            const twoWeeks = new Date(); twoWeeks.setDate(twoWeeks.getDate() + 14);
            setIssueData({ copy_id: '', client_id: '', due_date: formatDateForInput(twoWeeks) });
            fetchData(); // Refresh all data including issues and copies status
        } catch (err) {
            setActionError(err.detail || 'Failed to issue book. Is the copy actually available? Check status.');
            setIsLoading(false);
        }
    };

    // Return an issued book
    const handleReturnBook = async (e) => {
        e.preventDefault();
        if (!returnIssueId) { setActionError('Please select an issued item to return.'); return; }
        setActionError(null); setSuccessMessage(null); setIsLoading(true);
        try {
            // The API likely needs the *issue ID*, not the copy ID
            await copyIssueService.returnBook(parseInt(returnIssueId));
            setSuccessMessage('Book marked as returned successfully!');
            setReturnIssueId(''); // Reset selection
            fetchData(); // Refresh all data including issues and copies status
        } catch (err) {
            setActionError(err.detail || 'Failed to return book.');
            setIsLoading(false);
        }
    };

    // Calculate available copies for the issue dropdown
    const availableCopies = useMemo(() =>
        // Ensure status check is case-insensitive and handles potential nulls/undefined
        (allCopies || []).filter(copy => copy.status?.toLowerCase() === 'available'),
        [allCopies]
    );

    // --- Tailwind Classes (Helpers) ---
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const buttonClass = `inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 whitespace-nowrap`;
    const primaryButtonClass = `${buttonClass} bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;
    const successButtonClass = `${buttonClass} bg-green-600 hover:bg-green-700 focus:ring-green-500`;
    const paginationButtonClass = "px-4 py-2 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";

    // --- JSX Rendering ---
    return (
        <div className="management-container p-4 md:p-6 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">📚 Copies & Issuing</h2>

            {/* Global Error/Success Messages */}
            {error && <p className="error-message p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">{error}</p>}
            {successMessage && <p className="success-message p-3 bg-green-100 border border-green-300 text-green-700 text-sm rounded-md text-center">{successMessage}</p>}

            {/* --- Tabs --- */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {/* Manage Copies Tab Button */}
                    <button
                        className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'copies' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('copies')} disabled={isLoading}
                    >
                        Manage Copies ({filteredCopies.length}{copySearchTerm ? ` / ${allCopies.length}` : ''})
                    </button>
                    {/* Issue Book Tab Button */}
                    <button
                        className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'issue' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('issue')} disabled={isLoading}
                    >
                        Issue Book
                    </button>
                    {/* Return Book Tab Button */}
                    <button
                        className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'return' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('return')} disabled={isLoading}
                    >
                        Return Book ({filteredIssuedItems.length}{issueSearchTerm ? ` / ${currentlyIssuedItems.length}` : ''} Out)
                    </button>
                </nav>
            </div>

            {/* --- Tab Content --- */}
            <div className="mt-6">
                {isLoading && <p className="text-center text-gray-500 py-4">Loading data...</p>}

                <AnimatePresence mode="wait">
                    {/* --- Manage Copies Tab Content --- */}
                    {activeTab === 'copies' && !isLoading && (
                        <motion.div key="copies-tab" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                            {/* Add Copy Form */}
                            <div className="add-copy-section form-section bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Book Copy</h3>
                                {actionError && activeTab === 'copies' && <p className="error-message mb-4 text-sm text-red-600">{actionError}</p>}
                                <form onSubmit={handleAddCopy} className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
                                    <div className="form-group flex-grow w-full sm:w-auto min-w-[200px]">
                                        <label htmlFor="book_id" className={labelClass}>Book *</label>
                                        <select id="book_id" name="book_id" value={newCopyData.book_id} onChange={handleCopyInputChange} required className={inputClass} disabled={isLoading}>
                                            <option value="">Select Book</option>
                                            {/* Now iterates over ALL books */}
                                            {(books || []).map(book => <option key={book.id} value={book.id}>{book.title} (ID: {book.id})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group flex-grow w-full sm:w-auto min-w-[200px]">
                                        <label htmlFor="location_id" className={labelClass}>Location *</label>
                                        <select id="location_id" name="location_id" value={newCopyData.location_id} onChange={handleCopyInputChange} required className={inputClass} disabled={isLoading}>
                                            <option value="">Select Location</option>
                                            {(locations || []).map(loc => <option key={loc.id} value={loc.id}>{loc.name} {loc.rack ? `(R:${loc.rack})` : ''} {loc.shelf ? `(S:${loc.shelf})` : ''}</option>)}
                                        </select>
                                    </div>
                                    <button type="submit" className={`${primaryButtonClass} w-full sm:w-auto`} disabled={isLoading}>
                                        <PlusIcon className="h-5 w-5 mr-1 inline-block" aria-hidden="true"/> Add Copy
                                    </button>
                                </form>
                            </div>

                            {/* List All Copies */}
                            <div className="list-section bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                                <div className="list-header flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                                     <h3 className="text-lg font-medium text-gray-800">All Copies ({filteredCopies.length}{copySearchTerm ? ` / ${allCopies.length}` : ''})</h3>
                                    <div className="relative flex-grow w-full sm:w-auto max-w-xs">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true"/></div>
                                        <input type="text" placeholder="Search ID, Title, Location, Status..." value={copySearchTerm} onChange={(e) => setCopySearchTerm(e.target.value)} className={`${inputClass} pl-10`} disabled={isLoading}/>
                                    </div>
                                    <button onClick={fetchData} disabled={isLoading} className="refresh-button inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                        <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true"/> Refresh
                                    </button>
                                </div>

                                {(filteredCopies && filteredCopies.length > 0) ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Copy ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Title</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th></tr></thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {paginatedCopies.map(copy => {
                                                        const statusClass = copy.status?.toLowerCase() === 'available' ? 'bg-green-100 text-green-800' : (copy.status?.toLowerCase() === 'on loan' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800');
                                                        return (<tr key={copy.id} className="hover:bg-gray-50"><td className="px-4 py-4 text-sm text-gray-500">{copy.id}</td><td className="px-6 py-4 text-sm font-medium text-gray-900">{copy.book?.title || 'N/A'}</td><td className="px-6 py-4 text-sm text-gray-500">{copy.location?.name || 'N/A'}</td><td className="px-6 py-4 text-sm"><span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>{copy.status || 'Unknown'}</span></td></tr>);
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        {copyTotalPages > 1 && (
                                            <div className="pagination-controls mt-4 pt-4 border-t border-gray-200 flex justify-center items-center gap-4"><button onClick={goToPreviousCopyPage} disabled={copyCurrentPage === 1 || isLoading} className={paginationButtonClass}>Previous</button><span className="text-sm font-medium text-gray-700">Page {copyCurrentPage} of {copyTotalPages}</span><button onClick={goToNextCopyPage} disabled={copyCurrentPage === copyTotalPages || isLoading} className={paginationButtonClass}>Next</button></div>
                                        )}
                                    </>
                                ) : ( <p className="text-center text-gray-500 py-6">{copySearchTerm ? 'No copies match your search.' : 'No copies found.'}</p> )}
                            </div>
                        </motion.div>
                    )}

                    {/* --- Issue Book Tab Content --- */}
                    {activeTab === 'issue' && !isLoading && (
                        <motion.div key="issue-tab" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="issue-book-section form-section bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">Issue Book to User</h3>
                            {actionError && activeTab === 'issue' && <p className="error-message mb-4 text-sm text-red-600">{actionError}</p>}
                            <form onSubmit={handleIssueBook} className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
                                <div className="form-group flex-grow w-full sm:w-auto min-w-[200px]">
                                    <label htmlFor="copy_id" className={labelClass}>Available Copy *</label>
                                    <select id="copy_id" name="copy_id" value={issueData.copy_id} onChange={handleIssueInputChange} required className={inputClass} disabled={isLoading}>
                                        <option value="">Select Available Copy</option>
                                        {(availableCopies || []).map(copy => <option key={copy.id} value={copy.id}>ID: {copy.id} ({copy.book?.title || 'N/A'})</option>)}
                                        {/* Show message if list is empty */}
                                        {(availableCopies || []).length === 0 && <option disabled>No copies available</option>}
                                    </select>
                                </div>
                                <div className="form-group flex-grow w-full sm:w-auto min-w-[200px]">
                                    <label htmlFor="client_id" className={labelClass}>User *</label>
                                    <select id="client_id" name="client_id" value={issueData.client_id} onChange={handleIssueInputChange} required className={inputClass} disabled={isLoading}>
                                        <option value="">Select User</option>
                                        {(users || []).map(user => <option key={user.id} value={user.id}>{user.username} ({user.full_name || user.fullName || 'No Name'})</option>)}
                                    </select>
                                </div>
                                <div className="form-group w-full sm:w-auto">
                                    <label htmlFor="due_date" className={labelClass}>Due Date *</label>
                                    <input type="date" id="due_date" name="due_date" value={issueData.due_date} onChange={handleIssueInputChange} required className={inputClass} disabled={isLoading} />
                                </div>
                                <button type="submit" className={`${successButtonClass} w-full sm:w-auto`} disabled={isLoading}>Issue Book</button>
                            </form>
                        </motion.div>
                    )}

                    {/* --- Return Book Tab Content --- */}
                    {activeTab === 'return' && !isLoading && (
                        <motion.div key="return-tab" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                            {/* Return Form */}
                            <div className="return-book-section form-section bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="text-lg font-medium text-gray-800 mb-4">Return Issued Book</h3>
                                {actionError && activeTab === 'return' && <p className="error-message mb-4 text-sm text-red-600">{actionError}</p>}
                                <form onSubmit={handleReturnBook} className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
                                    <div className="form-group flex-grow w-full sm:w-auto min-w-[300px]">
                                        <label htmlFor="returnIssueId" className={labelClass}>Book on Loan *</label>
                                        <select id="returnIssueId" name="returnIssueId" value={returnIssueId} onChange={handleReturnInputChange} required className={inputClass} disabled={isLoading}>
                                            <option value="">Select Book to Return</option>
                                            {/* Use currentlyIssuedItems for the dropdown */}
                                            {(currentlyIssuedItems || []).map(issue => <option key={issue.id} value={issue.id}>#{issue.id} - {issue.book_copy?.book?.title || 'N/A'} (Copy: {issue.copy_id}, To: {issue.client?.username || 'N/A'})</option>)}
                                            {(currentlyIssuedItems || []).length === 0 && <option disabled>No books currently issued</option>}
                                        </select>
                                    </div>
                                    <button type="submit" className={`${primaryButtonClass} w-full sm:w-auto`} disabled={isLoading}>Mark as Returned</button>
                                </form>
                            </div>

                            {/* List Currently Issued */}
                            <div className="list-section bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                                <div className="list-header flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                                    <h3 className="text-lg font-medium text-gray-800">Currently Issued ({filteredIssuedItems.length}{issueSearchTerm ? ` / ${currentlyIssuedItems.length}` : ''})</h3>
                                    <div className="relative flex-grow w-full sm:w-auto max-w-xs">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true"/></div>
                                        <input type="text" placeholder="Search Issue#, Copy#, Title, User..." value={issueSearchTerm} onChange={(e) => setIssueSearchTerm(e.target.value)} className={`${inputClass} pl-10`} disabled={isLoading}/>
                                    </div>
                                    <button onClick={fetchData} disabled={isLoading} className="refresh-button inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                        <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true"/> Refresh
                                    </button>
                                </div>
                                {(filteredIssuedItems && filteredIssuedItems.length > 0) ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue#</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Copy#</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Title</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th></tr></thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {paginatedIssuedItems.map(issue => (<tr key={issue.id} className="hover:bg-gray-50"><td className="px-4 py-4 text-sm text-gray-500">{issue.id}</td><td className="px-4 py-4 text-sm text-gray-500">{issue.copy_id}</td><td className="px-6 py-4 text-sm font-medium text-gray-900">{issue.book_copy?.book?.title || 'N/A'}</td><td className="px-6 py-4 text-sm text-gray-500">{issue.client?.username || 'N/A'}</td><td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{issue.issue_date ? new Date(issue.issue_date).toLocaleDateString() : 'N/A'}</td><td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{issue.due_date ? new Date(issue.due_date).toLocaleDateString() : 'N/A'}</td></tr>))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {issueTotalPages > 1 && (
                                            <div className="pagination-controls mt-4 pt-4 border-t border-gray-200 flex justify-center items-center gap-4"><button onClick={goToPreviousIssuePage} disabled={issueCurrentPage === 1 || isLoading} className={paginationButtonClass}>Previous</button><span className="text-sm font-medium text-gray-700">Page {issueCurrentPage} of {issueTotalPages}</span><button onClick={goToNextIssuePage} disabled={issueCurrentPage === issueTotalPages || isLoading} className={paginationButtonClass}>Next</button></div>
                                        )}
                                    </>
                                ) : ( <p className="text-center text-gray-500 py-6">{issueSearchTerm ? 'No issued items match your search.' : 'No books are currently issued.'}</p> )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CopiesIssuing;