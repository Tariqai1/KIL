import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import apiClient from '../api/apiClient'; // API client import karein
import { getCoverUrl } from '../utils/cover'; // PDF URL fix karne ke liye helper

const ReadBook = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // States
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookTitle, setBookTitle] = useState("");

    // Fetch Book Data on Mount
    useEffect(() => {
        const fetchBook = async () => {
            try {
                // Book ki details layein
                const response = await apiClient.get(`/api/books/${id}`);
                const book = response.data;
                
                setBookTitle(book.title);

                // PDF URL nikalein
                const rawPdf = book.pdf_url || book.pdf_file;
                if (rawPdf) {
                    const fullUrl = getCoverUrl(rawPdf); // Helper use karein URL fix karne ke liye
                    setPdfUrl(fullUrl);
                } else {
                    setError("This book does not have a PDF file attached.");
                }

            } catch (err) {
                console.error("Error loading book:", err);
                setError("Failed to load the book. It might be deleted or restricted.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchBook();
    }, [id]);

    return (
        <div className="flex flex-col h-screen bg-slate-100">
            {/* --- Header --- */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
                        title="Back"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-slate-800 text-sm md:text-base line-clamp-1">
                            {loading ? "Loading..." : bookTitle}
                        </h1>
                        <p className="text-xs text-slate-500">Reading Mode</p>
                    </div>
                </div>
            </div>

            {/* --- Main Content (PDF Viewer) --- */}
            <div className="flex-1 relative overflow-hidden bg-slate-200">
                {loading ? (
                    // Loading Spinner
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-medium animate-pulse">Loading Document...</p>
                        </div>
                    </div>
                ) : error ? (
                    // Error State
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md text-center">
                            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-xl font-bold">!</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Cannot Open Book</h3>
                            <p className="text-slate-500 mb-6">{error}</p>
                            <button 
                                onClick={() => navigate(-1)}
                                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                ) : (
                    // ✅ ACTUAL PDF VIEWER (Browser Native)
                    <iframe 
                        src={pdfUrl} 
                        className="w-full h-full border-none"
                        title="PDF Viewer"
                    />
                )}
            </div>
        </div>
    );
};

export default ReadBook;