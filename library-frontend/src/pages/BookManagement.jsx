// src/pages/BookManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { bookService } from '../api/bookService';
import BookForm from '../components/book/BookForm'; // Your Tailwind styled form
import Modal from '../components/common/Modal'; // Your Headless UI Modal
import BookDetailsModal from '../components/user/BookDetailsModal';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/20/solid'; // Example icons

const BookManagement = () => {
    // --- State ---
    const [allBooks, setAllBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Modal/Form States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState(null); // null = Add mode, object = Edit mode
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingBook, setDeletingBook] = useState(null);
    const [selectedBookForView, setSelectedBookForView] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    // Search/Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        setIsLoading(true); // <--- THIS IS THE FIX: Add full logic
        setError(null);
        try {
            const data = await bookService.getAllBooks({ approved_only: false }); // Fetch all (approved/pending)
            setAllBooks(data || []);
            // setCurrentPage(1); // Reset page only on filter/search change
        } catch (err) {
            setError(err.detail || 'Could not fetch books.');
            setAllBooks([]);
        } finally {
            setIsLoading(false); // <--- THIS IS THE FIX: Set loading to false
        }
    }, []); // Empty dependency array

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Filtering & Pagination ---
    const filteredBooks = useMemo(() => {
        if (!searchTerm) return allBooks;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return allBooks.filter(book =>
            book.title.toLowerCase().includes(lowerCaseSearch) ||
            (book.author && book.author.toLowerCase().includes(lowerCaseSearch)) ||
            (book.isbn && book.isbn.toLowerCase().includes(lowerCaseSearch))
        );
    }, [allBooks, searchTerm]);

    const paginatedBooks = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredBooks.slice(startIndex, endIndex);
    }, [filteredBooks, currentPage, itemsPerPage]);

    const totalPages = useMemo(() => {
        return Math.ceil(filteredBooks.length / itemsPerPage);
    }, [filteredBooks, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1); // Reset page when search term changes
    }, [searchTerm]);

    const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
    const goToPreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

    // --- Action Handlers ---
    const handleBookAdded = (newBook) => {
        fetchData(); // Refresh list
        closeEditModal(); // Close the modal (which was in 'Add' mode)
    };
    const handleBookUpdated = (updatedBook) => {
        fetchData(); // Refresh list
        closeEditModal(); // Close the modal
    };
    const handleAddClick = () => { // Renamed from your code
        setEditingBook(null); // Set to null for 'Add' mode
        setIsEditModalOpen(true);
    };
    const handleEditClick = (book) => {
        setEditingBook(book); // Set data for 'Edit' mode
        setIsEditModalOpen(true);
    };
    const handleViewClick = (book) => {
    setSelectedBookForView(book);
    setIsViewModalOpen(true);
    };

    const handleDeleteClick = (book) => {
        setDeletingBook(book);
        setIsDeleteModalOpen(true);
    };
    const confirmDelete = async () => { // <--- THIS IS THE FIX: Add full logic
        if (!deletingBook) return;
        setError(null);
        try {
            await bookService.deleteBook(deletingBook.id);
            closeDeleteModal();
            fetchData(); // Refresh list
        } catch (err) {
            // Display error in modal or page
            setError(err.detail || 'Failed to delete book.');
            closeDeleteModal(); // Close modal even on error
        }
    };
    const closeEditModal = () => { setIsEditModalOpen(false); setEditingBook(null); };
    const closeDeleteModal = () => { setIsDeleteModalOpen(false); setDeletingBook(null); };

    // --- JSX Return ---
    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">📖 Book Management</h2>
                <button
                    onClick={handleAddClick} // Open Add Modal
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add New Book
                </button>
            </div>

            {/* Loading & Error Messages */}
            {isLoading && <p className="text-center text-gray-500 py-4">Loading books...</p>}
            {error && <p className="error-message p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">{error}</p>}

            {/* Book List Section */}
            {!isLoading && !error && (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                    {/* List Header: Search and Refresh */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                        <div className="relative flex-grow w-full sm:w-auto">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by Title, Author, ISBN..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <button onClick={fetchData} disabled={isLoading} className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap">
                            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    {/* Table */}
                    {filteredBooks.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
                                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
                                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Restricted</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedBooks.map((book) => (
                                            <tr key={book.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{book.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{book.title}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.author || '-'}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{book.isbn || '-'}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ book.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }`}>
                                                        {book.is_approved ? 'Yes' : 'No'}
                                                     </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ book.is_restricted ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800' }`}>
                                                        {book.is_restricted ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                   {/* Modal wala button hata kar ye Link wapas lagayein */}
                                                   <Link 
                                                        to={`${book.id}`} 
                                                        className="text-teal-600 hover:text-teal-900" 
                                                        title="View Details"
                                                    >
                                                        <EyeIcon className="h-5 w-5 inline-block" />
                                                    </Link>
                                                    <button onClick={() => handleEditClick(book)} className="text-indigo-600 hover:text-indigo-900" title="Edit Book">
                                                        <PencilIcon className="h-5 w-5 inline-block" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(book)} className="text-red-600 hover:text-red-900" title="Delete Book">
                                                         <TrashIcon className="h-5 w-5 inline-block" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="pagination-controls mt-4 pt-4 border-t border-gray-200 flex justify-center items-center gap-4">
                                    <button onClick={goToPreviousPage} disabled={currentPage === 1 || isLoading} className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                                    <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages}</span>
                                    <button onClick={goToNextPage} disabled={currentPage === totalPages || isLoading} className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-center text-gray-500 py-6">{searchTerm ? 'No books match your search.' : 'No books found in the library.'}</p>
                    )}
                </div>
            )}

            {/* --- Add / Edit Book Modal --- */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                title={editingBook ? `Edit Book: ${editingBook.title}` : 'Add New Book'}
                size="max-w-4xl" // Make modal wider for the form
            >
                {/* Render BookForm inside modal */}
                 <BookForm
                    initialData={editingBook} // Pass null for 'Add', book data for 'Edit'
                    isEditing={!!editingBook} // True if editingBook is not null
                    onBookUpdated={handleBookUpdated} // Callback for successful update
                    onBookAdded={handleBookAdded}    // Callback for successful add (closes modal too)
                />
            </Modal>

            {/* --- Delete Confirmation Modal --- */}
             <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Confirm Deletion" size="max-w-md">
                 {/* Display error if delete fails */}
                 {error && <p className="error-message mb-4">{error}</p>} {/* Use error state */}
                 {deletingBook && (
                     <div className="space-y-4">
                         <p className="text-sm text-gray-600">Are you sure you want to delete the book: <strong className="font-medium text-gray-800">{deletingBook.title}</strong> (ID: {deletingBook.id})?</p>
                         <p className="text-xs text-red-700">This action will perform a soft delete and cannot be easily undone.</p>
                         {/* Modal Action Buttons */}
                         <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                             <button type="button" className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={closeDeleteModal} >Cancel</button>
                             <button type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" onClick={confirmDelete} >Confirm Delete</button>
                         </div>
                     </div>
                 )}
            </Modal>
            

        </div> // End container
    );
};

export default BookManagement;