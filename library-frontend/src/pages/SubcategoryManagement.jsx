import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast'; // ✅ Professional Notifications
import { 
    PencilIcon, TrashIcon, PlusIcon, 
    ArrowPathIcon, MagnifyingGlassIcon, FolderIcon 
} from '@heroicons/react/20/solid';

// --- Services ---
import { categoryService } from '../api/categoryService';

// --- UI Components ---
import Modal from '../components/common/Modal'; // Ensure this exists or use headless UI

// ==========================================
// 1. HELPER COMPONENTS
// ==========================================

// --- Skeleton Loader ---
const TableSkeleton = () => (
    <div className="animate-pulse space-y-3 p-4">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4">
                <div className="h-10 bg-gray-100 rounded w-1/4"></div>
                <div className="h-10 bg-gray-100 rounded w-1/4"></div>
                <div className="h-10 bg-gray-100 rounded w-1/2"></div>
            </div>
        ))}
    </div>
);

// --- Subcategory Form (Internal Component) ---
const SubcategoryForm = ({ initialData, categories, onSubmit, isSubmitting, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', description: '', category_id: '' });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                category_id: initialData.category?.id || ''
            });
        } else {
            setFormData({ name: '', description: '', category_id: '' });
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Parent Category Select */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Parent Category</label>
                <select 
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    required
                    disabled={isSubmitting}
                >
                    <option value="">Select Parent...</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Name Input */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subcategory Name</label>
                <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Tafseer, Seerah"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    disabled={isSubmitting}
                />
            </div>

            {/* Description Input */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description (Optional)</label>
                <textarea 
                    rows="3"
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                    placeholder="Brief details about this subcategory..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    disabled={isSubmitting}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95"
                >
                    {isSubmitting ? 'Saving...' : (initialData ? 'Update Changes' : 'Create Subcategory')}
                </button>
            </div>
        </form>
    );
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

const SubcategoryManagement = () => {
    // --- State ---
    const [subcategories, setSubcategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal & Form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSub, setEditingSub] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Search
    const [searchTerm, setSearchTerm] = useState('');

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [subData, catData] = await Promise.all([
                categoryService.getAllSubcategories(),
                categoryService.getAllCategories()
            ]);
            setSubcategories(subData || []);
            setCategories(catData || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load data.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Actions ---
    const handleSave = async (formData) => {
        if (!formData.name.trim() || !formData.category_id) {
            toast.error("Name and Parent Category are required.");
            return;
        }

        const toastId = toast.loading("Processing...");
        setIsSubmitting(true);

        const payload = { ...formData, category_id: parseInt(formData.category_id) };

        try {
            if (editingSub) {
                await categoryService.updateSubcategory(editingSub.id, payload);
                toast.success("Subcategory updated successfully!", { id: toastId });
            } else {
                await categoryService.createSubcategory(payload);
                toast.success("Subcategory created successfully!", { id: toastId });
            }
            setIsModalOpen(false);
            setEditingSub(null);
            fetchData();
        } catch (err) {
            toast.error(err.detail || "Operation failed.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This cannot be undone.")) return;
        
        const toastId = toast.loading("Deleting...");
        try {
            await categoryService.deleteSubcategory(id);
            toast.success("Subcategory deleted.", { id: toastId });
            fetchData();
        } catch (err) {
            toast.error(err.detail || "Could not delete subcategory.", { id: toastId });
        }
    };

    // --- Filtering ---
    const filteredSubs = useMemo(() => {
        if (!searchTerm) return subcategories;
        const lower = searchTerm.toLowerCase();
        return subcategories.filter(s => 
            s.name.toLowerCase().includes(lower) || 
            s.category?.name?.toLowerCase().includes(lower)
        );
    }, [searchTerm, subcategories]);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gray-50">
            
            {/* --- Page Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FolderIcon className="w-8 h-8 text-indigo-500" />
                        Subcategories
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Organize books into specific topics under main categories.</p>
                </div>
                <button 
                    onClick={() => { setEditingSub(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Subcategory
                </button>
            </div>

            {/* --- Table Container --- */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                
                {/* Search Toolbar */}
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                    <h3 className="font-bold text-gray-700">All Subcategories ({filteredSubs.length})</h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative flex-grow sm:flex-grow-0">
                            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input 
                                type="text" 
                                placeholder="Search by name or parent..." 
                                className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        <button onClick={fetchData} className="p-2 bg-white border border-gray-300 rounded-lg text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <TableSkeleton />
                ) : filteredSubs.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FolderIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-medium">No subcategories found</h3>
                        <p className="text-gray-500 text-sm mt-1">Try adjusting your search or add a new one.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subcategory Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Parent Category</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <AnimatePresence>
                                    {filteredSubs.map((sub) => (
                                        <motion.tr 
                                            key={sub.id}
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }} 
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">#{sub.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{sub.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {sub.category?.name || 'Unassigned'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={sub.description}>
                                                {sub.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button 
                                                    onClick={() => { setEditingSub(sub); setIsModalOpen(true); }} 
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(sub.id)} 
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
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

            {/* --- Modal --- */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSub ? "Edit Subcategory" : "Add New Subcategory"}>
                <SubcategoryForm 
                    initialData={editingSub} 
                    categories={categories} 
                    isSubmitting={isSubmitting} 
                    onSubmit={handleSave} 
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default SubcategoryManagement;