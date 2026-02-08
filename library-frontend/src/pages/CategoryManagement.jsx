// src/pages/CategoryManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PencilIcon, 
    TrashIcon, 
    PlusIcon, 
    ArrowPathIcon, 
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/20/solid';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import { categoryService } from '../api/categoryService'; 
import Modal from '../components/common/Modal'; 
import '../assets/css/ManagementPages.css'; 

// Spinner Component
const SpinnerIcon = ({ className = "text-white" }) => (
    <svg className={`animate-spin -ml-0.5 mr-2 h-4 w-4 ${className}`} viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CategoryManagement = () => {
    // --- State ---
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); 
    const [successMsg, setSuccessMsg] = useState(null); // New: Success Message
    const [actionError, setActionError] = useState(null); 

    // Search & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // Har page par kitni categories dikhani hain

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // New: Delete Modal
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form State
    const [editingCategory, setEditingCategory] = useState(null); 
    const [formData, setFormData] = useState({ name: '', description: '' });

    // --- Data Fetching ---
    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await categoryService.getAllCategories(); 
            setCategories(data || []);
        } catch (err) {
            setError(err.detail || 'Could not fetch categories.');
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    // --- Search & Pagination Logic (The "Smart" Part) ---
    const filteredCategories = useMemo(() => {
        return categories.filter(cat => 
            cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [categories, searchTerm]);

    const paginatedCategories = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCategories.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCategories, currentPage]);

    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

    // Reset page on search
    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    // --- Handlers ---
    const handleSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3000); // 3 sec baad gayab
        fetchCategories();
    };

    const openModal = (category = null) => {
        setActionError(null);
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name || '', description: category.description || '' });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return setActionError('Category name required.');

        setIsSubmitting(true);
        setActionError(null);
        try {
            if (editingCategory) {
                await categoryService.updateCategory(editingCategory.id, formData);
                handleSuccess('Category updated successfully!');
            } else {
                await categoryService.createCategory(formData);
                handleSuccess('Category created successfully!');
            }
            setIsModalOpen(false);
        } catch (err) {
            setActionError(err.detail || 'Operation failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteClick = (category) => {
        setCategoryToDelete(category);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        setIsSubmitting(true);
        try {
            await categoryService.deleteCategory(categoryToDelete.id);
            handleSuccess('Category deleted successfully.');
            setIsDeleteModalOpen(false);
            setCategoryToDelete(null);
        } catch (err) {
            alert(err.detail || 'Failed to delete category.'); // Fallback alert inside modal if needed
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- CSS Classes ---
    const inputClass = "block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm";
    const btnBase = "inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
    const btnPrimary = `${btnBase} bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500`;
    const btnSecondary = `${btnBase} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500`;
    const btnDanger = `${btnBase} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;

    return (
        <SkeletonTheme baseColor="#f3f4f6" highlightColor="#ffffff">
            <div className="management-container p-6 space-y-6 max-w-7xl mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
                        <p className="text-sm text-gray-500 mt-1">Organize your library's book categories.</p>
                    </div>
                    <button onClick={() => openModal(null)} className={btnPrimary}>
                        <PlusIcon className="h-5 w-5 mr-2" /> Add Category
                    </button>
                </div>

                {/* Notifications */}
                <AnimatePresence>
                    {successMsg && (
                        <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} className="bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 text-sm font-medium text-center">
                            {successMsg}
                        </motion.div>
                    )}
                    {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm text-center">{error}</div>}
                </AnimatePresence>

                {/* Controls Bar (Search & Refresh) */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search categories..." 
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchCategories} disabled={isLoading} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh List">
                        <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Categories Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-6"><Skeleton count={5} height={50} className="mb-2" /></div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <p className="text-lg font-medium">No categories found.</p>
                            <p className="text-sm">Try adjusting your search or add a new one.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedCategories.map(cat => (
                                            <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">#{cat.id}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{cat.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{cat.description || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => openModal(cat)} className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors">
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => confirmDeleteClick(cat)} className="text-red-600 hover:text-red-900 transition-colors">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {filteredCategories.length > itemsPerPage && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                        disabled={currentPage === 1}
                                        className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                                    </button>
                                    <span className="text-sm text-gray-700">
                                        Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                                    </span>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                        disabled={currentPage === totalPages}
                                        className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* --- Main Add/Edit Modal --- */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Create Category'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {actionError && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{actionError}</div>}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input type="text" className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Science Fiction" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea rows="3" className={inputClass} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief description..." />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={() => setIsModalOpen(false)} className={btnSecondary}>Cancel</button>
                            <button type="submit" disabled={isSubmitting} className={btnPrimary}>
                                {isSubmitting ? <><SpinnerIcon /> Saving...</> : (editingCategory ? 'Update' : 'Create')}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* --- Delete Confirmation Modal --- */}
                <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Are you sure you want to delete <span className="font-bold text-gray-900">{categoryToDelete?.name}</span>? 
                            <br/><span className="text-xs text-red-500">This action cannot be undone.</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className={btnSecondary} disabled={isSubmitting}>Cancel</button>
                            <button onClick={handleDelete} className={btnDanger} disabled={isSubmitting}>
                                {isSubmitting ? <SpinnerIcon /> : <TrashIcon className="h-4 w-4 mr-2" />} 
                                {isSubmitting ? 'Deleting...' : 'Delete Category'}
                            </button>
                        </div>
                    </div>
                </Modal>

            </div>
        </SkeletonTheme>
    );
};

export default CategoryManagement;