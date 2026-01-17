// src/pages/UserManagement.jsx
import React from 'react'; // Import React only once
import { useState, useEffect, useCallback, useMemo } from 'react';
import { userService } from '../api/userService'; // Service for API calls
import UserForm from '../components/user/UserForm'; // Your form component
import Modal from '../components/common/Modal';    // Your modal component

// --- FIX: Import Skeleton and SkeletonTheme correctly in ONE line ---
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'; // Skeleton CSS
// --- END FIX ---

import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/20/solid'; // Icons

// --- FIX: Removed the duplicate Skeleton import ---
// The line "import Skeleton from 'react-loading-skeleton';" has been deleted.
// --- END FIX ---

const UserManagement = () => {
  // --- State ---
  const [allUsers, setAllUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // For page-level errors
  const [actionError, setActionError] = useState(null); // For modal/action errors

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = Add, object = Edit
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setActionError(null);
    try {
      // Fetch users and roles concurrently
      const [usersData, rolesData] = await Promise.all([
        userService.getAllUsers(),
        userService.getAllRoles(), // Assuming this is in userService
      ]);
      setAllUsers(usersData || []);
      setRoles(rolesData || []);
      // setCurrentPage(1); // Reset page only if filters change, not on every refresh
    } catch (err) {
      console.error('Fetch data error:', err);
      setError(
        err.detail || 'Could not fetch user data. Please try refreshing.'
      );
      setAllUsers([]); // Ensure it's an array on error
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filtering Logic ---
  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return allUsers;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    // Filter based on username, email, or full name
    return allUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(lowerCaseSearch) ||
        user.email.toLowerCase().includes(lowerCaseSearch) ||
        (user.full_name &&
          user.full_name.toLowerCase().includes(lowerCaseSearch)) ||
        (user.fullName && user.fullName.toLowerCase().includes(lowerCaseSearch)) // Handle alias if used
    );
  }, [allUsers, searchTerm]);

  // --- Pagination Logic ---
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    // Ensure totalPages is at least 1 even if filteredUsers is empty
    return Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  }, [filteredUsers, itemsPerPage]);

  // Reset page number if search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination handlers
  const goToNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  // --- Action Handlers ---
  const handleUserActionSuccess = () => {
    fetchData(); // Refresh data on success
    closeEditModal();
    closeDeleteModal();
  };

  // Open Add modal
  const handleAddClick = () => {
    setEditingUser(null); // Ensure it's in Add mode
    setActionError(null); // Clear previous errors
    setIsEditModalOpen(true);
  };

  // Open Edit modal
  const handleEditClick = (user) => {
    setEditingUser(user);
    setActionError(null);
    setIsEditModalOpen(true);
  };

  // Open Delete modal
  const handleDeleteClick = (user) => {
    setDeletingUser(user);
    setActionError(null);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete action
  const confirmDelete = async () => {
    if (!deletingUser) return;
    setActionError(null); // Clear previous errors
    try {
      await userService.deleteUser(deletingUser.id);
      handleUserActionSuccess(); // Refresh list and close modal
    } catch (err) {
      console.error('Delete user error:', err);
      setActionError(err.detail || 'Failed to delete user.'); // Show error in modal
      // Keep modal open on error
    }
  };

  // Close Modals
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setActionError(null); // Clear errors when closing
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingUser(null);
    setActionError(null);
  };

  // --- Render ---
  return (
    // SkeletonTheme wraps the entire component
    <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
      <div className="p-4 md:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">
            👥 User Management
          </h2>
          <button
            onClick={handleAddClick} // Open Add Modal
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add New User
          </button>
        </div>
        {/* Global Error Message */}
        {error && (
          <p className="error-message p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">
            {error}
          </p>
        )}
        {/* User List Section */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
          {/* List Header: Search and Refresh */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <h3 className="text-lg font-medium text-gray-800 self-start sm:self-center">
              All Users ({filteredUsers.length}
              {searchTerm ? ` / ${allUsers.length}` : ''})
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-grow w-full sm:w-auto sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Search Username, Email, Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap disabled:opacity-50"
              >
                <ArrowPathIcon
                  className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Loading Skeleton or Table */}
          {isLoading ? (
             <div className="overflow-x-auto">
               <table className="min-w-full">
                 <thead className="bg-gray-50">
                   <tr>
                     {[ 'ID', 'Username', 'Email', 'Full Name', 'Role', 'Status', 'Actions'].map((header) => ( <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th> ))}
                   </tr>
                 </thead>
                 <tbody>
                   {[...Array(itemsPerPage)].map((_, i) => (
                     <tr key={i} className="bg-white">
                       <td className="px-4 py-4 whitespace-nowrap text-sm"><Skeleton width={30} /></td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm"><Skeleton width={100} /></td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm"><Skeleton width={150} /></td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm"><Skeleton width={120} /></td>
                       <td className="px-4 py-4 whitespace-nowrap text-sm"><Skeleton width={80} /></td>
                       <td className="px-4 py-4 whitespace-nowrap text-center text-sm"><Skeleton width={60} /></td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm"><Skeleton width={50} /></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          ) : filteredUsers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> ID </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Username </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Email </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Full Name </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Role </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"> Status </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"> Actions </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500"> {user.id} </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"> {user.username} </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"> {user.email} </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"> {user.full_name || user.fullName || '-'} </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500"> {user.role?.name || '-'} </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                          <span
                            className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : user.status === 'Inactive'
                                ? 'bg-gray-100 text-gray-800'
                                : user.status === 'Suspended'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800' // Default/Deleted
                            }`}
                          >
                            {user.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button onClick={() => handleEditClick(user)} className="text-indigo-600 hover:text-indigo-900" title="Edit User"> <PencilIcon className="h-5 w-5 inline-block" /> </button>
                          <button onClick={() => handleDeleteClick(user)} className="text-red-600 hover:text-red-900" title="Delete User"> <TrashIcon className="h-5 w-5 inline-block" /> </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-controls mt-4 pt-4 border-t border-gray-200 flex justify-center items-center gap-4">
                  <button onClick={goToPreviousPage} disabled={currentPage === 1 || isLoading} className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"> Previous </button>
                  <span className="text-sm font-medium text-gray-700"> Page {currentPage} of {totalPages} </span>
                  <button onClick={goToNextPage} disabled={currentPage === totalPages || isLoading} className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"> Next </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 py-6"> {searchTerm ? 'No users match your search.' : 'No users found.'} </p>
          )}
        </div>

        {/* --- Add / Edit User Modal --- */}
        <Modal
          isOpen={isEditModalOpen} onClose={closeEditModal}
          title={editingUser ? `Edit User: ${editingUser.username}` : 'Add New User'}
          size="max-w-2xl"
        >
          <UserForm
            key={editingUser ? `edit-${editingUser.id}` : 'add-new'}
            onSubmitSuccess={handleUserActionSuccess} // Use combined success handler
            initialData={editingUser}
            isEditing={!!editingUser}
            roles={roles}
            onError={setActionError} // Pass error handler to form
            onCancel={closeEditModal} // Pass cancel handler to form
          />
          {/* Display actionError here if UserForm doesn't handle it internally */}
           {actionError && <p className="error-message mt-4 text-sm text-red-600 text-center">{actionError}</p>}
        </Modal>

        {/* --- Delete Confirmation Modal --- */}
        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Confirm Deletion" size="max-w-md">
            {actionError && <p className="error-message mb-4 text-sm text-red-600">{actionError}</p>}
            {deletingUser && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete user:{' '}
                  <strong className="font-medium text-gray-800">{deletingUser.username}</strong> (ID: {deletingUser.id})?
                </p>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button type="button" className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={closeDeleteModal} >Cancel</button>
                  <button type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" onClick={confirmDelete} >Confirm Delete</button>
                </div>
              </div>
            )}
        </Modal>

      </div> {/* End container */}
    </SkeletonTheme>
  );
};

export default UserManagement;