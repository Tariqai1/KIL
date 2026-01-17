// src/pages/PublicBookList.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { bookService } from '../api/bookService';
import { MagnifyingGlassIcon, ArrowPathIcon, BookOpenIcon } from '@heroicons/react/20/solid';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import '../assets/css/ManagementPages.css'; // Common styles

// Helper to get full URL for images
const getStaticUrl = (relativePath) => {
    if (!relativePath) return null;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    return `${baseUrl}${relativePath}`;
};

// Placeholder for missing cover images
const PlaceholderBookIcon = () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
        <BookOpenIcon className="h-16 w-16 text-gray-400" />
    </div>
);

// Skeleton Card for loading state
const BookCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <Skeleton height={288} /> {/* Corresponds to aspect-w-2 aspect-h-3 h-72 */}
        <div className="p-4">
            <Skeleton width="80%" height={20} />
            <Skeleton width="50%" height={16} className="mt-2" />
        </div>
    </div>
);

const PublicBookList = () => {
    // --- State ---
    const [allBooks, setAllBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12); // Show more items per page on a grid

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // --- IMPORTANT: Fetches ONLY approved books ---
            const data = await bookService.getAllBooks(true); 
            setAllBooks(data || []);
        } catch (err) {
            console.error("Error fetching approved books:", err);
            setError(err.detail || 'Could not load the book catalog.');
            setAllBooks([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Filtering Logic ---
    const filteredBooks = useMemo(() => {
        if (!searchTerm) return allBooks;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return allBooks.filter(book =>
            book.title.toLowerCase().includes(lowerCaseSearch) ||
            (book.author && book.author.toLowerCase().includes(lowerCaseSearch)) ||
            (book.isbn && book.isbn.includes(lowerCaseSearch))
        );
    }, [allBooks, searchTerm]);

    // --- Pagination Logic ---
    const paginatedBooks = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredBooks.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredBooks, currentPage, itemsPerPage]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredBooks.length / itemsPerPage));
    }, [filteredBooks, itemsPerPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
    const goToPreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
    const paginationButtonClass = "px-4 py-2 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Page Header */}
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">📚 Book Catalog</h2>
            
            {error && <p className="error-message p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">{error}</p>}

            {/* Search and Refresh Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative flex-grow w-full sm:w-auto sm:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Title, Author, or ISBN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={isLoading}
                    />
                </div>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap disabled:opacity-50"
                >
                    <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Book Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {isLoading ? (
                    // Show skeleton loaders
                    [...Array(itemsPerPage)].map((_, i) => <BookCardSkeleton key={i} />)
                ) : paginatedBooks.length > 0 ? (
                    // Show actual book cards
                    paginatedBooks.map((book) => (
                        <Link 
                            to={`/books/${book.id}`} // Link to the detail page
                            key={book.id} 
                            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 group"
                        >
                            <div className="aspect-w-2 aspect-h-3 h-72"> {/* Fixed height container */}
                                {book.cover_image_url ? (
                                    <img 
                                        src={getStaticUrl(book.cover_image_url)} 
                                        alt={book.title} 
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" 
                                    />
                                ) : (
                                    <PlaceholderBookIcon />
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="text-base font-semibold text-gray-800 truncate" title={book.title}>
                                    {book.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 truncate" title={book.author}>
                                    {book.author || 'Unknown Author'}
                                </p>
                            </div>
                        </Link>
                    ))
                ) : (
                    // Show no results message
                    <div className="col-span-full text-center text-gray-500 py-10">
                        <p className="text-lg font-medium">No books found</p>
                        {searchTerm ? (
                            <p>Try adjusting your search terms.</p>
                        ) : (
                            <p>There are no approved books in the catalog right now.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
                <div className="pagination-controls mt-6 pt-4 border-t border-gray-200 flex justify-center items-center gap-4">
                    <button onClick={goToPreviousPage} disabled={currentPage === 1} className={paginationButtonClass}>
                        Previous
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button onClick={goToNextPage} disabled={currentPage === totalPages} className={paginationButtonClass}>
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default PublicBookList;