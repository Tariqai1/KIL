// src/pages/SubcategoryManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, TrashIcon, PlusIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Hum 'categoryService' ko hi dobara use karenge
import { categoryService } from '../api/categoryService'; 
import Modal from '../components/common/Modal';
import '../assets/css/ManagementPages.css';

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

const SubcategoryManagement = () => {
    // --- State ---
    const [subcategories, setSubcategories] = useState([]);
    const [categories, setCategories] = useState([]); // Parent categories ke liye
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);

    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingSubcategory, setEditingSubcategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', category_id: '' });

    // Search
    const [searchTerm, setSearchTerm] = useState('');

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Dono (categories aur subcategories) ko ek saath fetch karein
            const [subcatData, catData] = await Promise.all([
                categoryService.getAllSubcategories(),
                categoryService.getAllCategories() // Form dropdown ke liye zaroori
            ]);
            setSubcategories(subcatData || []);
            setCategories(catData || []);
        } catch (err) {
            setError(err.detail || 'Could not fetch data. Please try refreshing.');
            setSubcategories([]);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    // --- Filtering ---
    const filteredSubcategories = useMemo(() => {
        if (!searchTerm) return subcategories;
        const lowerSearch = searchTerm.toLowerCase();
        return subcategories.filter(sub =>
            sub.name.toLowerCase().includes(lowerSearch) ||
            (sub.category?.name && sub.category.name.toLowerCase().includes(lowerSearch)) || // Parent category ke naam se search karein
            (sub.description && sub.description.toLowerCase().includes(lowerSearch))
        );
    }, [subcategories, searchTerm]);

    // --- Modal & Form Handlers ---
    const openModal = (subcategory = null) => {
        setActionError(null);
        if (subcategory) {
            setEditingSubcategory(subcategory);
            setFormData({
                name: subcategory.name || '',
                description: subcategory.description || '',
                category_id: subcategory.category?.id || '' // Parent category ki ID set karein
            });
        } else {
            setEditingSubcategory(null);
            setFormData({ name: '', description: '', category_id: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSubcategory(null);
        setFormData({ name: '', description: '', category_id: '' });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.category_id) {
            setActionError('Subcategory name and parent category are required.');
            return;
        }

        setIsSubmitting(true);
        setActionError(null);
        
        // Data ko number mein convert karein
        const payload = {
            ...formData,
            category_id: parseInt(formData.category_id, 10)
        };

        try {
            if (editingSubcategory) {
                await categoryService.updateSubcategory(editingSubcategory.id, payload);
            } else {
                await categoryService.createSubcategory(payload);
            }
            closeModal();
            fetchData(); // List refresh karein
        } catch (err) {
            setActionError(err.detail || `Failed to ${editingSubcategory ? 'update' : 'create'} subcategory.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (subcategoryId) => {
        if (!window.confirm('Are you sure you want to delete this subcategory?')) {
            return;
        }
        setError(null);
        try {
            await categoryService.deleteSubcategory(subcategoryId);
            fetchData(); // List refresh karein
        } catch (err) {
            setError(err.detail || 'Failed to delete subcategory. It might be in use by a book.');
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
                    <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">📚 Subcategory Management</h2>
                    <button
                        onClick={() => openModal(null)}
                        className={`${primaryButtonClass} bg-indigo-600`}
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add Subcategory
                    </button>
                </div>

                {error && <p className="error-message p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">{error}</p>}

                {/* --- Subcategories List --- */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                    <div className="p-4 md:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800">Existing Subcategories</h3>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <div className="relative flex-grow w-full sm:w-auto max-w-xs">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400"/></div>
                                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputClass} pl-10`} disabled={isLoading}/>
                            </div>
                            <button onClick={fetchData} disabled={isLoading} className="refresh-button inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                                <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-4"><Skeleton height={40} count={5} /></div>
                    ) : filteredSubcategories.length === 0 ? (
                        <p className="text-center text-gray-500 p-6">{searchTerm ? 'No subcategories match your search.' : 'No subcategories found. Add one to get started.'}</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <AnimatePresence initial={false}>
                                        {filteredSubcategories.map(sub => (
                                            <motion.tr 
                                                key={sub.id}
                                                variants={cardVariants} initial="hidden" animate="visible" exit="exit" layout
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sub.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.category?.name || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 max-w-sm truncate" title={sub.description}>{sub.description || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                    <button onClick={() => openModal(sub)} className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-100" title="Edit">
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-red-600 hover:text-red-800 rounded-md hover:bg-red-100" title="Delete">
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
                    title={editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {actionError && <p className="error-message text-sm text-red-600">{actionError}</p>}
                        
                        <div>
                            <label htmlFor="category_id" className={labelClass}>Parent Category *</label>
                            <select
                                id="category_id"
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                className={inputClass}
                                disabled={isSubmitting || categories.length === 0}
                                required
                            >
                                <option value="">Select a parent category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="name" className={labelClass}>Subcategory Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Tafseer, Hadith, Seerah"
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
                                {isSubmitting ? 'Saving...' : (editingSubcategory ? 'Update' : 'Add')}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </SkeletonTheme>
    );
};

export default SubcategoryManagement;   