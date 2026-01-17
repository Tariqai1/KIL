// src/pages/RestrictedBookPermissions.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { bookService } from '../api/bookService'; // To get books
import { userService } from '../api/userService'; // To get users & roles
import { restrictedBookService } from '../api/restrictedBookService'; // Service for this page
import '../assets/css/ManagementPages.css'; // Use shared CSS (Adjust path if needed)
import '../assets/css/RestrictedBookPermissions.css'; // Specific styles (Adjust path if needed)

const RestrictedBookPermissions = () => {
    // --- State Variables ---
    const [allBooks, setAllBooks] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [currentPermissions, setCurrentPermissions] = useState([]); // Permissions for the selected book

    // UI Control States
    const [selectedBookId, setSelectedBookId] = useState(''); // ID of the currently selected restricted book
    const [isLoading, setIsLoading] = useState(true); // Loading initial data (books, users, roles)
    const [isPermLoading, setIsPermLoading] = useState(false); // Loading permissions for the selected book
    const [error, setError] = useState(null); // General page error
    const [actionError, setActionError] = useState(null); // Error during assign/revoke
    const [successMessage, setSuccessMessage] = useState(null); // Success message after assign/revoke

    // Assign Form State
    const [assignType, setAssignType] = useState('user'); // 'user' or 'role'
    const [selectedUserId, setSelectedUserId] = useState(''); // User ID to assign permission to
    const [selectedRoleId, setSelectedRoleId] = useState(''); // Role ID to assign permission to

    // --- Data Fetching ---
    // Fetch initial data (all books, users, roles) once on mount
    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [booksData, usersData, rolesData] = await Promise.all([
                bookService.getAllBooks(false), // Get all books to find restricted ones
                userService.getAllUsers(),
                userService.getAllRoles(),
            ]);
            setAllBooks(booksData || []);
            setUsers(usersData || []);
            setRoles(rolesData || []);
        } catch (err) {
            setError(err.detail || 'Could not fetch initial data (books, users, roles).');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // Fetch permissions specifically for the selected book whenever 'selectedBookId' changes
    useEffect(() => {
        const fetchPermissions = async () => {
            if (!selectedBookId) {
                setCurrentPermissions([]); // Clear permissions if no book is selected
                return;
            }
            setIsPermLoading(true);
            setActionError(null); // Clear errors from previous selection
            setSuccessMessage(null); // Clear success messages
            try {
                const perms = await restrictedBookService.getPermissionsForBook(parseInt(selectedBookId));
                setCurrentPermissions(perms || []); // Update current permissions state
            } catch (err) {
                 setActionError(`Failed to load permissions for selected book (ID: ${selectedBookId}).`);
                 setCurrentPermissions([]); // Clear permissions on error
            } finally {
                setIsPermLoading(false);
            }
        };
        fetchPermissions();
    }, [selectedBookId]); // Dependency array: run effect when selectedBookId changes

    // --- Event Handlers ---
    // Update selected book ID and reset assignment form
    const handleBookChange = (e) => {
        setSelectedBookId(e.target.value);
        // Reset assignment form state when book changes
        setSelectedUserId('');
        setSelectedRoleId('');
        setAssignType('user');
        setActionError(null); // Clear errors
        setSuccessMessage(null); // Clear success messages
    };

     // Handle submission of the "Assign Permission" form
    const handleAssignPermission = async (e) => {
        e.preventDefault(); // Prevent default form submission
        // Basic validation
        if (!selectedBookId || (assignType === 'user' && !selectedUserId) || (assignType === 'role' && !selectedRoleId)) {
            setActionError("Please select a book and a user/role to assign permission.");
            return;
        }
        setIsPermLoading(true); // Use perm loading state to indicate action in progress
        setActionError(null);
        setSuccessMessage(null);
        try {
            // Prepare payload for the API
            const payload = {
                book_id: parseInt(selectedBookId),
                user_id: assignType === 'user' ? parseInt(selectedUserId) : null, // Send user ID or null
                role_id: assignType === 'role' ? parseInt(selectedRoleId) : null, // Send role ID or null
            };
            // Call the API service
            await restrictedBookService.assignPermission(payload);
            setSuccessMessage(`Permission assigned successfully!`);
            // Reset form fields
            setSelectedUserId('');
            setSelectedRoleId('');
            // Refetch permissions for the current book to update the list
            const perms = await restrictedBookService.getPermissionsForBook(parseInt(selectedBookId));
            setCurrentPermissions(perms || []);

        } catch (err) {
            // Display error from API or a generic message
            setActionError(err.detail || 'Failed to assign permission. It might already exist for this user/role.');
        } finally {
             setIsPermLoading(false); // Stop loading indicator
        }
    };

    // Handle clicking the "Revoke" button for a permission
    const handleRevokePermission = async (permissionId, targetName) => {
         // Add a confirmation step
        if (!window.confirm(`Are you sure you want to revoke permission from ${targetName}?`)) {
             return; // Stop if user cancels
        }

        setIsPermLoading(true); // Indicate action in progress
        setActionError(null);
        setSuccessMessage(null);
         try {
            // Call the API service to delete the permission entry
            await restrictedBookService.revokePermission(permissionId);
            setSuccessMessage(`Permission revoked successfully!`);
            // Refetch permissions for the current book to update the list
            const perms = await restrictedBookService.getPermissionsForBook(parseInt(selectedBookId));
            setCurrentPermissions(perms || []);
         } catch(err) {
             setActionError(err.detail || 'Failed to revoke permission.');
         } finally {
             setIsPermLoading(false); // Stop loading indicator
         }
    };

    // --- Derived Data ---
    // Filter the list of all books to get only those marked as restricted
    const restrictedBooks = useMemo(() =>
        allBooks.filter(book => book.is_restricted),
        [allBooks]
    );

    // --- JSX Rendering ---
    return (
        // Use shared management container and Tailwind padding
        <div className="management-container p-4 md:p-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-2">🛡️ Restricted Book Permissions</h2>
            <p className="text-sm text-gray-500 mb-6">Grant specific users or roles permission to view books marked as 'Restricted'.</p>

            {/* Show loading indicator for initial data load */}
            {isLoading && <p>Loading initial data (books, users, roles)...</p>}
            {/* Show general page error */}
            {error && <p className="error-message">{error}</p>}

            {/* Render content only after initial load */}
            {!isLoading && !error && (
                <>
                    {/* --- Book Selection Dropdown --- */}
                    <div className="form-group book-selection mb-8 max-w-lg"> {/* Tailwind margin and max-width */}
                        <label htmlFor="restricted-book-select" className="block text-sm font-medium text-gray-600 mb-1">Select Restricted Book:</label>
                        <select
                            id="restricted-book-select"
                            value={selectedBookId}
                            onChange={handleBookChange}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" // Tailwind styles
                        >
                            <option value="">-- Select a Book --</option>
                            {restrictedBooks.map(book => (
                                <option key={book.id} value={book.id}>{book.title} (ID: {book.id})</option>
                            ))}
                            {/* Message if no restricted books exist */}
                            {restrictedBooks.length === 0 && <option disabled>No restricted books found</option>}
                        </select>
                    </div>

                    {/* --- Display Assign Form and Current Permissions (only if a book is selected) --- */}
                    {selectedBookId && (
                        <div className="permissions-display-grid grid grid-cols-1 md:grid-cols-2 gap-8"> {/* Tailwind grid */}
                            {/* Assign New Permission Form Section */}
                            <div className="assign-permission-section form-section bg-white p-6 rounded-lg shadow-md"> {/* Tailwind styles */}
                                <h3 className="text-xl font-medium text-gray-800 mb-4">Assign New Permission</h3>
                                {/* Display action errors/success messages */}
                                {actionError && <p className="error-message">{actionError}</p>}
                                {successMessage && <p className="success-message">{successMessage}</p>}

                                <form onSubmit={handleAssignPermission} className="space-y-4"> {/* Tailwind spacing */}
                                    {/* Radio buttons to choose between User and Role */}
                                    <div className="form-group radio-group flex items-center gap-6 mb-4"> {/* Tailwind flex */}
                                         <label className="block text-sm font-medium text-gray-600">Assign To:</label>
                                         <label className="flex items-center cursor-pointer">
                                             <input type="radio" name="assignType" value="user" checked={assignType === 'user'} onChange={() => setAssignType('user')} className="mr-2" /> User
                                         </label>
                                          <label className="flex items-center cursor-pointer">
                                             <input type="radio" name="assignType" value="role" checked={assignType === 'role'} onChange={() => setAssignType('role')} className="mr-2" /> Role
                                         </label>
                                    </div>

                                    {/* User Dropdown (conditional) */}
                                    {assignType === 'user' && (
                                        <div className="form-group">
                                            <label htmlFor="user-select" className="block text-sm font-medium text-gray-600 mb-1">Select User *</label>
                                            <select
                                                id="user-select"
                                                value={selectedUserId}
                                                onChange={(e) => setSelectedUserId(e.target.value)}
                                                required
                                                disabled={isPermLoading} // Disable while action is in progress
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            >
                                                <option value="">-- Select User --</option>
                                                {users.map(user => (
                                                    <option key={user.id} value={user.id}>{user.username} ({user.full_name || user.fullName || 'No Name'})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Role Dropdown (conditional) */}
                                    {assignType === 'role' && (
                                        <div className="form-group">
                                            <label htmlFor="role-select" className="block text-sm font-medium text-gray-600 mb-1">Select Role *</label>
                                            <select
                                                id="role-select"
                                                value={selectedRoleId}
                                                onChange={(e) => setSelectedRoleId(e.target.value)}
                                                required
                                                disabled={isPermLoading} // Disable while action is in progress
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            >
                                                 <option value="">-- Select Role --</option>
                                                 {roles.map(role => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className="button-primary w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50" // Tailwind styles
                                        disabled={isPermLoading} // Disable button during action
                                    >
                                        {isPermLoading ? 'Assigning...' : 'Assign Permission'}
                                    </button>
                                </form>
                            </div>

                            {/* Current Permissions List Section */}
                            <div className="current-permissions-section list-section bg-white p-6 rounded-lg shadow-md"> {/* Tailwind styles */}
                                <h3 className="text-xl font-medium text-gray-800 mb-4">Current Permissions</h3>
                                {isPermLoading && <p className="text-gray-500">Loading permissions...</p>}
                                {!isPermLoading && currentPermissions.length === 0 && <p className="text-gray-500">No specific permissions assigned yet for this book.</p>}

                                {/* List of assigned permissions */}
                                {!isPermLoading && currentPermissions.length > 0 && (
                                    <ul className="permissions-list space-y-3"> {/* Tailwind spacing */}
                                        {currentPermissions.map(perm => {
                                            // Find the user or role name corresponding to the permission
                                            const targetUser = users.find(u => u.id === perm.user_id);
                                            const targetRole = roles.find(r => r.id === perm.role_id);
                                            const targetName = targetUser?.username || targetRole?.name || 'Unknown Target';
                                            const targetType = targetUser ? 'User' : (targetRole ? 'Role' : 'Unknown Type');

                                            return (
                                                 <li key={perm.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"> {/* Tailwind styles */}
                                                     <span className="text-sm text-gray-700">
                                                        <strong className="font-medium mr-2 text-indigo-600">{targetType}:</strong> {targetName}
                                                     </span>
                                                     {/* Revoke Button */}
                                                     <button
                                                         className="revoke-button text-red-600 hover:text-red-800 text-xs font-medium border border-red-300 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50" // Tailwind styles
                                                         onClick={() => handleRevokePermission(perm.id, targetName)} // Pass target name for confirmation
                                                         disabled={isPermLoading} // Disable while action is in progress
                                                         title="Revoke Permission"
                                                     >
                                                         &times; Revoke
                                                     </button>
                                                 </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div> // End container
    );
};

// --- Ensure the default export is present ---
export default RestrictedBookPermissions;