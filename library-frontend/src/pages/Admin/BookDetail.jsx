import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { bookService } from "../../api/bookService";
import { getBookCover, getCoverUrl } from "../../utils/cover";

// 👇 MAGIC IMPORT: Yahan bhi humne Master File bula li
// Ab ye file bhi wahi 'Smart Logic' use karegi
 

// --- react-pdf-viewer Imports ---
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

// --- Import Styles ---
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// --- Helper Component: Info Row ---
const InfoItem = ({ label, value, fullWidth = false }) => {
    if (value === null || value === undefined || value === "") return null;
    return (
        <div className={fullWidth ? "md:col-span-2" : "md:col-span-1"}>
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</dt>
            <dd className="mt-1 text-sm md:text-base text-gray-900 break-words font-medium">{value}</dd>
        </div>
    );
};

const BookDetail = () => {
    const { id } = useParams();
    const location = useLocation();

    // Navigation Logic (Admin se aaye to Admin pe wapas, User se aaye to User pe)
    const isAdminPath = location.pathname.startsWith('/admin');
    const backPath = isAdminPath ? "/admin/books" : "/books";

    const [book, setBook] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    useEffect(() => {
        const fetchBookDetails = async () => {
            if (!id) return;
            setIsLoading(true);
            setError(null);
            try {
                const data = await bookService.getBookById(id);
                setBook(data);
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err.detail || `Could not fetch details for book ID ${id}.`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBookDetails();
    }, [id]);

    if (isLoading) {
        return (
            <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="h-64 bg-gray-200 rounded-lg col-span-1"></div>
                    <div className="h-64 bg-gray-200 rounded-lg col-span-2"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block p-4 rounded-lg bg-red-50 text-red-600 border border-red-200">
                    <h2 className="text-lg font-bold">Error</h2>
                    <p>{error}</p>
                    <Link to="/books" className="mt-4 inline-block text-blue-600 hover:underline">
                        &larr; Return to Book List
                    </Link>
                </div>
            </div>
        );
    }

    if (!book) return <div className="p-6 text-center text-lg">Book not found.</div>;

    // --- 1. Get Cover URL (Using Master File) ---
    // Ye function khud dekh lega ki 'cover_image' hai ya 'cover_image_url'
    const coverImageUrl = getBookCover(book);

    // --- 2. Get PDF URL (Using Master File) ---
    // PDF ke liye hum 'getCoverUrl' use kar rahe hain taaki '/static' aur Windows path fix ho jaye
    // Hum dono fields check kar rahe hain 'pdf_url' ya 'pdf_file'
    const pdfUrl = getCoverUrl(book.pdf_url || book.pdf_file);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <Link 
                to={backPath} 
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
            >
                &larr; Back to Library
            </Link>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{book.title}</h1>
                    <p className="text-lg text-gray-600 mt-1">
                        {book.author ? `by ${book.author}` : <span className="italic">Unknown Author</span>}
                    </p>
                </div>
                <div className="flex gap-2">
                     <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wide ${book.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {book.is_approved ? 'Approved' : 'Pending'}
                    </span>
                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wide ${book.is_restricted ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {book.is_restricted ? 'Restricted' : 'Public'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                        {/* Image Logic Fixed */}
                        <img 
                            src={coverImageUrl} 
                            alt={book.title} 
                            className="w-full h-auto object-cover rounded-lg"
                            onError={(e) => { 
                                e.target.onerror = null; 
                                e.target.src = "https://via.placeholder.com/300x450?text=No+Cover"; 
                            }}
                        />
                    </div>
                    {/* PDF Logic Fixed */}
                    {pdfUrl && !pdfUrl.includes("No+Cover") ? (
                         <a 
                            href={pdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-full text-center px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm"
                        >
                            Download / Open PDF
                        </a>
                    ) : (
                        <div className="p-4 bg-gray-50 text-gray-500 text-center rounded-lg text-sm border border-gray-200">
                            No PDF Available
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-800">Book Information</h3>
                    </div>
                    <div className="p-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                            <InfoItem label="Publisher" value={book.publisher} />
                            <InfoItem label="Year" value={book.publication_year} />
                            <InfoItem label="Edition" value={book.edition} />
                            <InfoItem label="ISBN" value={book.isbn} />
                            <InfoItem label="Language" value={book.language?.name} />
                            <InfoItem label="Pages" value={book.page_count} />
                            <InfoItem label="Volumes" value={book.parts_or_volumes} />
                            <InfoItem label="Translator" value={book.translator} />
                            <InfoItem label="Price" value={book.price ? `${book.price}` : null} />
                            <InfoItem label="Purchase Date" value={book.date_of_purchase} />
                            
                            <InfoItem 
                                label="Categories" 
                                value={book.subcategories?.map(cat => cat.name).join(', ')} 
                                fullWidth 
                            />
                            <InfoItem label="Description" value={book.description} fullWidth />
                            <InfoItem label="Remarks" value={book.remarks} fullWidth />
                        </dl>
                    </div>
                </div>
            </div>

            {/* --- PDF Viewer Section --- */}
            {pdfUrl && !pdfUrl.includes("No+Cover") && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-8">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">Preview Book</h3>
                    </div>
                    
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                        <div style={{ height: '800px' }} className="w-full bg-gray-100">
                            <Viewer
                                fileUrl={pdfUrl}
                                plugins={[defaultLayoutPluginInstance]}
                                theme="light"
                            />
                        </div>
                    </Worker>
                </div>
            )}
        </div>
    );
};

export default BookDetail;