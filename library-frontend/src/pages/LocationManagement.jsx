// src/pages/LocationManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
// *** VVIP: This 'locationService' needs to be created ***
import { locationService } from '../api/locationService'; 
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, TrashIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/20/solid';
import '../assets/css/ManagementPages.css'; // Your existing CSS

// Spinner Icon
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

const LocationManagement = () => {
    // --- State ---
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Form State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [rack, setRack] = useState('');
    const [shelf, setShelf] = useState('');
    const [editingLocation, setEditingLocation] = useState(null); // { id: 1, name: 'Main Hall', ... }

    // --- Data Fetching ---
    const fetchLocations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await locationService.getAllLocations();
            setLocations(data || []);
        } catch (err) {
            setError(err.detail || 'Could not fetch locations.');
            setLocations([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    // --- Action Handlers ---

    const handleEditClick = (loc) => {
        setEditingLocation(loc);
        setName(loc.name);
        setRack(loc.rack);
        setShelf(loc.shelf);
        setError(null);
    };

    const handleCancelEdit = () => {
        setEditingLocation(null);
        setName('');
        setRack('');
        setShelf('');
        setError(null);
    };

    const handleDelete = async (locationId) => {
        if (!window.confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
            return;
        }

        setError(null);
        try {
            await locationService.deleteLocation(locationId);
            fetchLocations(); // Refresh list after deleting
        } catch (err) {
            setError(err.detail || 'Failed to delete location. It might be in use.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Location name cannot be empty.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        
        const locationData = { name, rack, shelf };

        try {
            if (editingLocation) {
                // --- Update Mode ---
                await locationService.updateLocation(editingLocation.id, locationData);
            } else {
                // --- Create Mode ---
                await locationService.createLocation(locationData);
            }
            
            // Reset form and refresh list
            handleCancelEdit();
            fetchLocations();

        } catch (err) {
            setError(err.detail || (editingLocation ? 'Failed to update location.' : 'Failed to create location.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- JSX Rendering ---
    return (
        <div className="management-container p-4 md:p-6 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">📍 Location Management</h2>

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
                            {editingLocation ? `Editing "${editingLocation.name}"` : 'Add New Location'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Name */}
                            <div>
                                <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Location Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="locationName"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Main Library, Section A"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {/* Rack */}
                            <div>
                                <label htmlFor="rackNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                    Rack
                                </label>
                                <input
                                    type="text"
                                    id="rackNumber"
                                    value={rack}
                                    onChange={(e) => setRack(e.target.value)}
                                    placeholder="e.g., A-01, 102"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {/* Shelf */}
                            <div>
                                <label htmlFor="shelfNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                    Shelf
                                </label>
                                <input
                                    type="text"
                                    id="shelfNumber"
                                    value={shelf}
                                    onChange={(e) => setShelf(e.target.value)}
                                    placeholder="e.g., 3, B"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-2">
                        {editingLocation && (
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
                            disabled={isSubmitting || !name.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-400"
                        >
                            {isSubmitting ? <SpinnerIcon /> : (editingLocation ? null : <PlusIcon className="-ml-1 mr-1 h-4 w-4" />)}
                            {editingLocation ? 'Update Location' : 'Add Location'}
                        </button>
                    </div>
                </form>
            </motion.div>

            {/* --- Existing Locations List --- */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="p-4 md:p-5 flex justify-between items-center border-b border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-800">Existing Locations</h3>
                    <button 
                        onClick={fetchLocations} 
                        disabled={isLoading}
                        className="refresh-button inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {isLoading && <p className="text-center text-gray-500 p-6">Loading locations...</p>}
                
                {!isLoading && locations.length === 0 && (
                    <p className="text-center text-gray-500 p-6">No locations found. Add one above to get started.</p>
                )}

                {!isLoading && locations.length > 0 && (
                    <div className="table-responsive">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rack</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shelf</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <AnimatePresence initial={false}>
                                    {locations.map(loc => (
                                        <motion.tr 
                                            key={loc.id}
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            layout
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loc.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{loc.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{loc.rack || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{loc.shelf || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button 
                                                    onClick={() => handleEditClick(loc)}
                                                    className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-100 disabled:opacity-50"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(loc.id)}
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

export default LocationManagement;