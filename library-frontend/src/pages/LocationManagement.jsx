// src/pages/LocationManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";

// ✅ Recommended: default import
import locationService from "../api/locationService";

import { motion, AnimatePresence } from "framer-motion";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

import toast, { Toaster } from "react-hot-toast";
import "../assets/css/ManagementPages.css";

// --------------------
// Spinner Icon
// --------------------
const SpinnerIcon = () => (
  <svg
    className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// --------------------
// Animations
// --------------------
const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// --------------------
// Error Extractor
// --------------------
const extractError = (err, fallback = "Something went wrong") => {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.detail ||
    err?.message ||
    fallback
  );
};

const LocationManagement = () => {
  // --------------------
  // State
  // --------------------
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [rack, setRack] = useState("");
  const [shelf, setShelf] = useState("");

  // Edit mode
  const [editingLocation, setEditingLocation] = useState(null);

  // Search
  const [search, setSearch] = useState("");

  // --------------------
  // Helpers
  // --------------------
  const resetForm = () => {
    setEditingLocation(null);
    setName("");
    setRack("");
    setShelf("");
  };

  const isValid = useMemo(() => {
    return name.trim().length >= 2;
  }, [name]);

  // --------------------
  // Fetch Locations
  // --------------------
  const fetchLocations = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await locationService.getAllLocations();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setLocations([]);
      toast.error(extractError(err, "Could not fetch locations."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // --------------------
  // Edit Handlers
  // --------------------
  const handleEditClick = (loc) => {
    setEditingLocation(loc);
    setName(loc?.name || "");
    setRack(loc?.rack || "");
    setShelf(loc?.shelf || "");
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  // --------------------
  // Delete
  // --------------------
  const handleDelete = async (locationId) => {
    const loc = locations.find((x) => x.id === locationId);
    const label = loc?.name ? ` (${loc.name})` : "";

    if (
      !window.confirm(
        `Are you sure you want to delete this location${label}?\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    const t = toast.loading("Deleting location...");

    try {
      // Optimistic UI
      setLocations((prev) => prev.filter((x) => x.id !== locationId));

      await locationService.deleteLocation(locationId);

      toast.success("Location deleted successfully!", { id: t });
    } catch (err) {
      toast.error(extractError(err, "Failed to delete location."), { id: t });

      // rollback
      fetchLocations();
    }
  };

  // --------------------
  // Submit (Create / Update)
  // --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid) {
      toast.error("Location name must be at least 2 characters.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      rack: rack.trim() || null,
      shelf: shelf.trim() || null,
    };

    const t = toast.loading(editingLocation ? "Updating..." : "Creating...");

    try {
      if (editingLocation) {
        await locationService.updateLocation(editingLocation.id, payload);
        toast.success("Location updated successfully!", { id: t });
      } else {
        await locationService.createLocation(payload);
        toast.success("Location created successfully!", { id: t });
      }

      resetForm();
      await fetchLocations();
    } catch (err) {
      toast.error(
        extractError(
          err,
          editingLocation ? "Failed to update location." : "Failed to create location."
        ),
        { id: t }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------
  // Filtered List
  // --------------------
  const filteredLocations = useMemo(() => {
    if (!search.trim()) return locations;

    const q = search.trim().toLowerCase();

    return locations.filter((loc) => {
      const joined = `${loc?.id} ${loc?.name} ${loc?.rack} ${loc?.shelf}`
        .toLowerCase()
        .trim();
      return joined.includes(q);
    });
  }, [locations, search]);

  // --------------------
  // UI
  // --------------------
  return (
    <div className="management-container p-4 md:p-6 space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            📍 Location Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create, update and manage racks & shelves for library books.
          </p>
        </div>

        <button
          onClick={fetchLocations}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Add/Edit Form */}
      <motion.div layout className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-bold text-lg text-gray-800">
                {editingLocation ? `✏️ Edit Location (ID: ${editingLocation.id})` : "➕ Add New Location"}
              </h3>

              {editingLocation && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Location Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Main Library, Section A"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 text-sm"
                  disabled={isSubmitting}
                />
                {!isValid && name.length > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Minimum 2 characters required.
                  </p>
                )}
              </div>

              {/* Rack */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Rack
                </label>
                <input
                  type="text"
                  value={rack}
                  onChange={(e) => setRack(e.target.value)}
                  placeholder="e.g., A-01, 102"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 text-sm"
                  disabled={isSubmitting}
                />
              </div>

              {/* Shelf */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Shelf
                </label>
                <input
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  placeholder="e.g., 3, B"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 text-sm"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 md:px-6 py-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <SpinnerIcon />
              ) : editingLocation ? (
                <PencilIcon className="-ml-1 mr-1 h-4 w-4" />
              ) : (
                <PlusIcon className="-ml-1 mr-1 h-4 w-4" />
              )}
              {editingLocation ? "Update Location" : "Add Location"}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Locations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h3 className="font-bold text-lg text-gray-800">Existing Locations</h3>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID / name / rack / shelf..."
            className="w-full md:w-[340px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
          />
        </div>

        {isLoading && (
          <div className="p-6 text-center text-gray-500">Loading locations...</div>
        )}

        {!isLoading && filteredLocations.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No locations found. Add one above to get started.
          </div>
        )}

        {!isLoading && filteredLocations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Rack
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Shelf
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence initial={false}>
                  {filteredLocations.map((loc) => (
                    <motion.tr
                      key={loc.id}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {loc.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {loc.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {loc.rack || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {loc.shelf || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditClick(loc)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-100"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(loc.id)}
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
    </div>
  );
};

export default LocationManagement;
