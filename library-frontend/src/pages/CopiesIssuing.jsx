import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
    PlusIcon, ArrowPathIcon, MagnifyingGlassIcon, 
    CheckCircleIcon, BookOpenIcon, UserCircleIcon, 
    CalendarIcon, ArrowDownTrayIcon 
} from '@heroicons/react/20/solid';

// --- API Services ---
import { copyIssueService } from '../api/copyIssueService';
import { bookService } from '../api/bookService';
import { locationService } from '../api/locationService';
import { userService } from '../api/userService';

// ==========================================
// 1. INTERNAL HELPER COMPONENTS
// ==========================================

// --- Simple Skeleton Loader ---
const TableSkeleton = () => (
    <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg w-full"></div>
        ))}
    </div>
);

// --- Visual Book Card (Light Theme) ---
const BookCard = ({ book, type = 'book' }) => {
    if (!book) return null;
    const isBook = type === 'book';
    
    // Construct Image URL safely
    const BASE_URL = "http://localhost:8000"; 
    const imgUrl = book.cover_image_url 
        ? (book.cover_image_url.startsWith('http') ? book.cover_image_url : `${BASE_URL}/${book.cover_image_url}`)
        : null;

    return (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
            {/* Image / Icon */}
            <div className="w-16 h-20 flex-shrink-0 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                {isBook && imgUrl ? (
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    isBook ? <BookOpenIcon className="w-8 h-8 text-blue-300" /> : <UserCircleIcon className="w-10 h-10 text-indigo-300"/>
                )}
            </div>
            
            {/* Details */}
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 truncate">
                    {isBook ? book.title : book.username}
                </h4>
                <p className="text-sm text-gray-500 truncate">
                    {isBook ? (book.author || 'Unknown Author') : (book.full_name || 'Library Member')}
                </p>
                {isBook && (
                    <div className="mt-1 flex gap-2">
                        <span className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600 font-mono">
                            ISBN: {book.isbn || 'N/A'}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600">
                            Edition: {book.edition || '1st'}
                        </span>
                    </div>
                )}
                 {!isBook && (
                    <div className="mt-1">
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold">
                            {book.role?.name || 'Student'}
                        </span>
                    </div>
                )}
            </div>
            
            {/* Status Icon */}
            <div className="flex items-start">
                <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
            </div>
        </motion.div>
    );
};

// --- Status Badge ---
const StatusBadge = ({ status }) => {
    const s = status?.toLowerCase();
    const styles = {
        available: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        issued: 'bg-amber-50 text-amber-700 ring-amber-600/20',
        returned: 'bg-blue-50 text-blue-700 ring-blue-600/20',
        lost: 'bg-red-50 text-red-700 ring-red-600/20',
    };
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[s] || 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
            {status}
        </span>
    );
};

// ==========================================
// 2. LOGIC HOOKS
// ==========================================

const useDataTable = (data, searchKeys, itemsPerPage = 8) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const lowerSearch = searchTerm.toLowerCase();
        return data.filter(item => 
            searchKeys.some(key => {
                const value = key.split('.').reduce((obj, k) => (obj ? obj[k] : null), item);
                return String(value || '').toLowerCase().includes(lowerSearch);
            })
        );
    }, [data, searchTerm, searchKeys]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    useEffect(() => setCurrentPage(1), [searchTerm]);

    return { searchTerm, setSearchTerm, currentPage, setCurrentPage, paginatedData, totalPages, totalCount: filteredData.length };
};

// ==========================================
// 3. TAB COMPONENTS
// ==========================================

// --- Inventory Tab (UPDATED) ---
const InventoryTab = ({ books, locations, copies, loading, onAddCopy }) => {
    const [newCopy, setNewCopy] = useState({ book_id: '', location_id: '' });
    const table = useDataTable(copies, ['id', 'book.title', 'location.name', 'status']);

    const selectedBook = useMemo(() => books.find(b => b.id === parseInt(newCopy.book_id)), [newCopy.book_id, books]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddCopy(newCopy, () => setNewCopy({ book_id: '', location_id: '' }));
    };

    return (
        <div className="space-y-6">
            {/* Add Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5 text-indigo-600"/> Add New Copy
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Select Book</label>
                            <select className="w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm py-2.5"
                                value={newCopy.book_id} onChange={e => setNewCopy({...newCopy, book_id: e.target.value})} required disabled={loading}>
                                <option value="">Choose a book...</option>
                                {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Storage Location</label>
                            <select className="w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm py-2.5"
                                value={newCopy.location_id} onChange={e => setNewCopy({...newCopy, location_id: e.target.value})} required disabled={loading}>
                                <option value="">Select Location...</option>
                                {/* ✅ FIX: Showing Rack and Shelf Details */}
                                {locations.map(l => (
                                    <option key={l.id} value={l.id}>
                                        {l.name} — Rack: {l.rack || 'N/A'}, Shelf: {l.shelf || 'N/A'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Visual Card */}
                    {selectedBook && <BookCard book={selectedBook} type="book" />}
                    
                    <div className="mt-4 flex justify-end">
                        <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50">
                            {loading ? 'Adding...' : 'Add to Inventory'}
                        </button>
                    </div>
                </form>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-700">All Copies ({table.totalCount})</h3>
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input type="text" placeholder="Search..." className="pl-9 pr-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={table.searchTerm} onChange={e => table.setSearchTerm(e.target.value)} />
                    </div>
                </div>
                {loading && !copies.length ? (
                    <div className="p-6"><TableSkeleton /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Book Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {table.paginatedData.map(copy => (
                                    <tr key={copy.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">#{copy.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{copy.book?.title}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {/* ✅ FIX: Showing Full Location Details in Table */}
                                            {copy.location ? (
                                                <span>
                                                    {copy.location.name} 
                                                    <span className="text-xs text-gray-400 ml-1">
                                                        ({copy.location.rack || '-'}/{copy.location.shelf || '-'})
                                                    </span>
                                                </span>
                                            ) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4"><StatusBadge status={copy.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <PaginationControls table={table} />
            </div>
        </div>
    );
};

// --- Issuing Tab ---
const IssuingTab = ({ copies, users, loading, onIssueBook }) => {
    const [issueData, setIssueData] = useState({ copy_id: '', client_id: '', due_date: new Date(Date.now() + 12096e5).toISOString().split('T')[0] });

    const availableCopies = useMemo(() => copies.filter(c => c.status === 'Available'), [copies]);
    
    // Find details for cards
    const selectedCopyBook = useMemo(() => copies.find(c => c.id === parseInt(issueData.copy_id))?.book, [issueData.copy_id, copies]);
    const selectedUser = useMemo(() => users.find(u => u.id === parseInt(issueData.client_id)), [issueData.client_id, users]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onIssueBook(issueData, () => setIssueData(prev => ({ ...prev, copy_id: '', client_id: '' })));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="p-2 bg-indigo-50 rounded-lg"><BookOpenIcon className="w-6 h-6 text-indigo-600"/></div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Issue a Book</h2>
                        <p className="text-sm text-gray-500">Assign a physical copy to a student or faculty member.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Copy Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Available Copy</label>
                            <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                value={issueData.copy_id} onChange={e => setIssueData({...issueData, copy_id: e.target.value})} required disabled={loading}>
                                <option value="">-- Select Copy --</option>
                                {availableCopies.map(c => <option key={c.id} value={c.id}>#{c.id} - {c.book?.title}</option>)}
                            </select>
                            <p className="mt-1 text-xs text-emerald-600 font-medium">{availableCopies.length} copies available.</p>
                        </div>
                        
                        {/* User Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Member</label>
                            <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                value={issueData.client_id} onChange={e => setIssueData({...issueData, client_id: e.target.value})} required disabled={loading}>
                                <option value="">-- Select User --</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.full_name})</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CalendarIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="date" className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                value={issueData.due_date} onChange={e => setIssueData({...issueData, due_date: e.target.value})} required disabled={loading} />
                        </div>
                    </div>

                    {/* Visual Confirmations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedCopyBook && <BookCard book={selectedCopyBook} type="book" />}
                        {selectedUser && <BookCard book={selectedUser} type="user" />}
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button type="submit" disabled={loading || availableCopies.length === 0} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-sm transition-all active:scale-[0.99] disabled:opacity-50">
                            {loading ? 'Processing...' : 'Confirm Issue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Returns Tab ---
const ReturnsTab = ({ issues, loading, onReturnBook }) => {
    const [returnId, setReturnId] = useState('');
    const activeIssues = useMemo(() => issues.filter(i => i.status === 'Issued'), [issues]);
    const table = useDataTable(issues, ['id', 'book_copy.book.title', 'client.username', 'status']);

    const handleSubmit = (e) => {
        e.preventDefault();
        onReturnBook(returnId, () => setReturnId(''));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <ArrowDownTrayIcon className="w-5 h-5 text-orange-600"/> Quick Return
                </h3>
                <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                    <div className="flex-grow">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Select Issued Book</label>
                        <select className="w-full rounded-lg border-gray-300 text-sm focus:ring-orange-500 focus:border-orange-500 py-2.5"
                            value={returnId} onChange={e => setReturnId(e.target.value)} required disabled={loading}>
                            <option value="">Choose item to return...</option>
                            {activeIssues.map(i => (
                                <option key={i.id} value={i.id}>
                                    #{i.id} - {i.book_copy?.book?.title} (User: {i.client?.username})
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-700 shadow-sm disabled:opacity-50">
                        Return Book
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-700">Circulation History</h3>
                    <input type="text" placeholder="Search history..." className="px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={table.searchTerm} onChange={e => table.setSearchTerm(e.target.value)} />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Issue ID</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Book</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Issued To</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Due Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table.paginatedData.map(issue => (
                                <tr key={issue.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-500">#{issue.id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                        {issue.book_copy?.book?.title}
                                        <span className="block text-xs text-gray-500">Copy ID: #{issue.copy_id}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-indigo-600">{issue.client?.username}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{issue.due_date}</td>
                                    <td className="px-6 py-4"><StatusBadge status={issue.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationControls table={table} />
            </div>
        </div>
    );
};

// --- Pagination Controls ---
const PaginationControls = ({ table }) => (
    table.totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <button onClick={() => table.setCurrentPage(p => Math.max(1, p - 1))} disabled={table.currentPage === 1} 
                className="text-xs font-medium text-gray-500 hover:text-indigo-600 disabled:opacity-50">Previous</button>
            <span className="text-xs text-gray-500">Page {table.currentPage} of {table.totalPages}</span>
            <button onClick={() => table.setCurrentPage(p => Math.min(table.totalPages, p + 1))} disabled={table.currentPage === table.totalPages} 
                className="text-xs font-medium text-gray-500 hover:text-indigo-600 disabled:opacity-50">Next</button>
        </div>
    )
);

// ==========================================
// 4. MAIN COMPONENT
// ==========================================

const CopiesIssuing = () => {
    const [data, setData] = useState({ copies: [], issues: [], books: [], locations: [], users: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('copies');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [copies, issues, books, locations, users] = await Promise.all([
                copyIssueService.getAllCopies(),
                copyIssueService.getAllIssues(),
                bookService.getAllBooks(false),
                locationService.getAllLocations(),
                userService.getAllUsers()
            ]);
            setData({ copies: copies || [], issues: issues || [], books: books || [], locations: locations || [], users: users || [] });
        } catch (err) {
            console.error(err);
            toast.error("Failed to load data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async (apiPromise, successMsg, resetCb) => {
        const toastId = toast.loading("Processing...");
        try {
            await apiPromise;
            toast.success(successMsg, { id: toastId });
            if (resetCb) resetCb();
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Action failed", { id: toastId });
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Library Circulation</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage copies, issue books, and handle returns.</p>
                </div>
                <button onClick={fetchData} className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all" title="Refresh">
                    <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex space-x-2 border-b border-gray-200">
                {['copies', 'issue', 'return'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-4 text-sm font-medium transition-all relative ${
                            activeTab === tab ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                        }`}>
                        {tab === 'copies' ? 'Inventory' : tab === 'issue' ? 'Issue Book' : 'Returns'}
                        {activeTab === tab && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    {activeTab === 'copies' && <InventoryTab {...data} loading={loading} onAddCopy={(d, r) => handleAction(copyIssueService.createCopy({book_id:+d.book_id, location_id:+d.location_id}), "Copy Added!", r)} />}
                    {activeTab === 'issue' && <IssuingTab {...data} loading={loading} onIssueBook={(d, r) => handleAction(copyIssueService.issueBook({copy_id:+d.copy_id, client_id:+d.client_id, due_date:d.due_date}), "Book Issued!", r)} />}
                    {activeTab === 'return' && <ReturnsTab {...data} loading={loading} onReturnBook={(id, r) => handleAction(copyIssueService.returnBook(+id), "Book Returned!", r)} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default CopiesIssuing;