// src/pages/DigitalAccessHistory.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { digitalAccessService } from '../api/digitalAccessService'; // Assuming you created this
import { userService } from '../api/userService'; // To get users for dropdown
import { Link } from 'react-router-dom';
import '../assets/css/ManagementPages.css'; // Use shared CSS (Adjust path if needed)
// Add specific styles if needed: import '../assets/css/ 
 

const DigitalAccessHistory = () => {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [accessHistory, setAccessHistory] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [error, setError] = useState(null);

    // Fetch users for the dropdown
    const fetchUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        setError(null);
        try {
            const usersData = await userService.getAllUsers();
            setUsers(usersData || []);
        } catch (err) {
            setError(err.detail || 'Could not fetch users.');
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Fetch history when selectedUserId changes
    useEffect(() => {
        const fetchHistory = async () => {
            if (!selectedUserId) {
                setAccessHistory([]); // Clear history if no user is selected
                return;
            }
            setIsLoadingHistory(true);
            setError(null); // Clear previous errors
            try {
                const historyData = await digitalAccessService.getAccessHistoryForUser(parseInt(selectedUserId));
                setAccessHistory(historyData || []);
            } catch (err) {
                setError(err.detail || `Could not fetch access history for user ID ${selectedUserId}.`);
                setAccessHistory([]); // Clear history on error
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [selectedUserId]); // Dependency: selectedUserId

    return (
        <div className="management-container p-4 md:p-6"> {/* Use generic class and Tailwind padding */}
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-2">💻 Digital Access History</h2>
            <p className="text-sm text-gray-500 mb-6">View the history of digital book access by user.</p>

            {isLoadingUsers && <p>Loading users...</p>}
            {error && <p className="error-message">{error}</p>}

            {/* --- User Selection --- */}
            {!isLoadingUsers && (
                <div className="form-group user-selection mb-6 max-w-md"> {/* Tailwind max width and margin */}
                    <label htmlFor="user-select-history" className="block text-sm font-medium text-gray-600 mb-1">Select User:</label>
                    <select
                        id="user-select-history"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        disabled={isLoadingHistory || isLoadingUsers} // Disable while loading either
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" // Tailwind styles
                    >
                        <option value="">-- Select a User --</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.username} ({user.full_name || user.fullName || 'No Name'})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* --- Access History List --- */}
            <div className="list-section bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-xl font-medium text-gray-800 mb-4">
                    Access Logs {selectedUserId ? `for User: ${users.find(u=>u.id === parseInt(selectedUserId))?.username || 'ID '+selectedUserId}` : ''}
                </h3>

                {isLoadingHistory && <p className="text-center text-gray-500 py-4">Loading history...</p>}
                {!isLoadingHistory && !selectedUserId && <p className="text-center text-gray-500 py-4">Please select a user to view their history.</p>}
                {!isLoadingHistory && selectedUserId && accessHistory.length === 0 && <p className="text-center text-gray-500 py-4">No digital access history found for this user.</p>}

                {!isLoadingHistory && accessHistory.length > 0 && (
                    <div className="table-responsive">
                        <table className="management-table access-history-table w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Log ID</th>
                                    <th scope="col" className="px-4 py-3">Book Title</th>
                                    <th scope="col" className="px-4 py-3">Access Timestamp</th>
                                    <th scope="col" className="px-4 py-3">Access Granted?</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accessHistory.map((log) => (
                                    <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-2">{log.id}</td>
                                        <td className="px-4 py-2">
                                            {/* Link to the book detail page */}
                                            <Link to={`/books/${log.book?.id}`} className="text-blue-600 hover:underline">
                                                {log.book?.title || 'N/A'}
                                            </Link>
                                            <span className="text-gray-500 ml-1">(ID: {log.book_id})</span>
                                        </td>
                                        <td className="timestamp-cell px-4 py-2 whitespace-nowrap">
                                            {log.access_timestamp ? new Date(log.access_timestamp).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="px-4 py-2">{log.access_granted ? 'Yes ✔️' : 'No ❌'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Add Pagination here if needed */}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Ensure this export line is present ---
export default DigitalAccessHistory;