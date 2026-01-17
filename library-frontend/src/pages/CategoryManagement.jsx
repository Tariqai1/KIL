// src/pages/CategoryManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, TrashIcon, PlusIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Zaroori: Aapko yeh 'categoryService.js' file banani hogi
import { categoryService } from '../api/categoryService'; 
import Modal from '../components/common/Modal'; // Modal component
import '../assets/css/ManagementPages.css'; // Common styles

// Spinner Icon
const SpinnerIcon = ({ className = "text-white" }) => (
    <svg className={`animate-spin -ml-0.5 mr-2 h-4 w-4 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
};

const CategoryManagement = () => {
    // --- State ---
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // Page-level error
    const [actionError, setActionError] = useState(null); // Modal/form error

    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null); // null = Add, object = Edit
    const [formData, setFormData] = useState({ name: '', description: '' });

    // --- Data Fetching ---
    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Aapko 'categoryService' banani hogi
            const data = await categoryService.getAllCategories(); 
            setCategories(data || []);
        } catch (err) {
            setError(err.detail || 'Could not fetch categories.');
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // --- Modal & Form Handlers ---
    const openModal = (category = null) => {
        setActionError(null);
        if (category) {
            setEditingCategory(category);
            setFormData({ 
                name: category.name || '', 
                description: category.description || '' 
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setActionError('Category name cannot be empty.');
            return;
        }

        setIsSubmitting(true);
        setActionError(null);

        try {
            if (editingCategory) {
                // --- Update Mode ---
                await categoryService.updateCategory(editingCategory.id, formData);
            } else {
                // --- Create Mode ---
                await categoryService.createCategory(formData);
            }
            closeModal();
            fetchCategories(); // Refresh list
        } catch (err) {
            setActionError(err.detail || (editingCategory ? 'Failed to update' : 'Failed to create') + ' category.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category? This may fail if it is linked to subcategories.')) {
            return;
        }
        setError(null); // Clear main page error
        try {
            await categoryService.deleteCategory(categoryId);
            fetchCategories(); // Refresh list
        } catch (err) {
            setError(err.detail || 'Failed to delete category. It might be in use.');
        }
    };

    // --- Tailwind Classes ---
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const primaryButtonClass = `inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`;
    const secondaryButtonClass = `inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`;

    return (
        <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
            <div className="management-container p-4 md:p-6 space-y-6">
                
                {/* --- Page Header --- */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">🏷️ Category Management</h2>
                    <button
                        onClick={() => openModal(null)} // Open in "Add" mode
                        className={`${primaryButtonClass} bg-indigo-600`}
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add Category
                    </button>
                </div>

                {error && <p className="error-message p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">{error}</p>}

                {/* --- Categories List --- */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                    <div className="p-4 md:p-5 flex justify-between items-center border-b border-gray-200">
                        <h3 className="font-semibold text-lg text-gray-800">Existing Categories</h3>
                        <button 
                            onClick={fetchCategories} 
                            disabled={isLoading}
                            className="refresh-button inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="p-4"><Skeleton height={40} count={5} /></div>
                    ) : categories.length === 0 ? (
                        <p className="text-center text-gray-500 p-6">No categories found. Add one to get started.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <AnimatePresence initial={false}>
                                        {categories.map(cat => (
                                            <motion.tr 
                                                key={cat.id}
                                                variants={cardVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                layout
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cat.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 max-w-sm truncate" title={cat.description}>{cat.description || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                    <button 
                                                        onClick={() => openModal(cat)}
                                                        className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-100"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(cat.id)}
                                                        className="p-1.5 text-red-600 hover:text-red-800 rounded-md hover:bg-red-100"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                {/* --- Add/Edit Modal --- */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title={editingCategory ? 'Edit Category' : 'Add New Category'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {actionError && <p className="error-message text-sm text-red-600 p-3 bg-red-50 rounded-md">{actionError}</p>}
                        <div>
                            <label htmlFor="name" className={labelClass}>Category Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Islamic History, Fiqh"
                                className={inputClass}
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                         <div>
                            <label htmlFor="description" className={labelClass}>Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Optional description..."
                                rows="3"
                                className={inputClass}
                                disabled={isSubmitting}
                            ></textarea>
                        </div>
                        <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200">
                             <button
                                type="button"
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className={secondaryButtonClass}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={primaryButtonClass}
                            >
                                {isSubmitting && <SpinnerIcon />}
                                {isSubmitting ? 'Saving...' : (editingCategory ? 'Update' : 'Add')}
                            </button>
                        </div>
                    </form>
                </Modal>

            </div>
        </SkeletonTheme>
    );
};

export default CategoryManagement;