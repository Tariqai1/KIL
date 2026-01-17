// src/pages/LanguageManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
// *** VVIP: Is 'languageService' ko aapko 'approvalService' ki tarah banana hoga ***
import { languageService } from '../api/languageService'; 
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, TrashIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/20/solid';
import '../assets/css/ManagementPages.css'; // Aapka existing CSS

// Spinner Icon (Aapke doosre component se)
const SpinnerIcon = () => (
    <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
};

const LanguageManagement = () => {
    // --- State ---
    const [languages, setLanguages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Form State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [languageName, setLanguageName] = useState('');
    const [editingLanguage, setEditingLanguage] = useState(null); // { id: 1, name: 'English' }

    // --- Data Fetching ---
    const fetchLanguages = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await languageService.getAllLanguages();
            setLanguages(data || []);
        } catch (err) {
            setError(err.detail || 'Could not fetch languages.');
            setLanguages([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLanguages();
    }, [fetchLanguages]);

    // --- Action Handlers ---

    const handleEditClick = (lang) => {
        setEditingLanguage(lang);
        setLanguageName(lang.name);
        setError(null);
    };

    const handleCancelEdit = () => {
        setEditingLanguage(null);
        setLanguageName('');
        setError(null);
    };

    const handleDelete = async (languageId) => {
        // Simple confirmation
        if (!window.confirm('Are you sure you want to delete this language? This action cannot be undone.')) {
            return;
        }

        setError(null);
        try {
            await languageService.deleteLanguage(languageId);
            // Refresh list after deleting
            fetchLanguages(); 
        } catch (err) {
            setError(err.detail || 'Failed to delete language. It might be in use.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!languageName.trim()) {
            setError('Language name cannot be empty.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            if (editingLanguage) {
                // --- Update Mode ---
                await languageService.updateLanguage(editingLanguage.id, { name: languageName });
            } else {
                // --- Create Mode ---
                await languageService.createLanguage({ name: languageName });
            }
            
            // Reset form and refresh list
            handleCancelEdit();
            fetchLanguages();

        } catch (err) {
            setError(err.detail || (editingLanguage ? 'Failed to update language.' : 'Failed to create language.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- JSX Rendering ---
    return (
        <div className="management-container p-4 md:p-6 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">📖 Language Management</h2>

            {error && (
                <div className="error-message p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">
                    {error}
                </div>
            )}

            {/* --- Add/Edit Form Card --- */}
            <motion.div 
                layout
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
                <form onSubmit={handleSubmit}>
                    <div className="p-4 md:p-5">
                        <h3 className="font-semibold text-lg text-gray-800 mb-3">
                            {editingLanguage ? `Editing "${editingLanguage.name}"` : 'Add New Language'}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="languageName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Language Name
                                </label>
                                <input
                                    type="text"
                                    id="languageName"
                                    value={languageName}
                                    onChange={(e) => setLanguageName(e.target.value)}
                                    placeholder="e.g., English, Hindi, Spanish"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-2">
                        {editingLanguage && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={isSubmitting}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting || !languageName.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-400"
                        >
                            {isSubmitting ? <SpinnerIcon /> : (editingLanguage ? null : <PlusIcon className="-ml-1 mr-1 h-4 w-4" />)}
                            {editingLanguage ? 'Update Language' : 'Add Language'}
                        </button>
                    </div>
                </form>
            </motion.div>

            {/* --- Existing Languages List --- */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="p-4 md:p-5 flex justify-between items-center border-b border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-800">Existing Languages</h3>
                    <button 
                        onClick={fetchLanguages} 
                        disabled={isLoading}
                        className="refresh-button inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {isLoading && <p className="text-center text-gray-500 p-6">Loading languages...</p>}
                
                {!isLoading && languages.length === 0 && (
                    <p className="text-center text-gray-500 p-6">No languages found. Add one above to get started.</p>
                )}

                {!isLoading && languages.length > 0 && (
                    <div className="table-responsive">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <AnimatePresence initial={false}>
                                    {languages.map(lang => (
                                        <motion.tr 
                                            key={lang.id}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            layout
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lang.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lang.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button 
                                                    onClick={() => handleEditClick(lang)}
                                                    className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-100 disabled:opacity-50"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(lang.id)}
                                                    className="p-1.5 text-red-600 hover:text-red-800 rounded-md hover:bg-red-100 disabled:opacity-50"
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
        </div>
    );
};

export default LanguageManagement;