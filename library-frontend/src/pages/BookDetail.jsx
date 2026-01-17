import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { bookService } from '../api/bookService';
import { getBookCover, getCoverUrl } from '../utils/cover';

// PDF Viewer Imports
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const BookDetail = () => {
    const { id } = useParams();
    const location = useLocation();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await bookService.getBookById(id);
                setBook(data);
            } catch (err) {
                console.error("Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return <div className="p-20 text-center animate-bounce">Loading Book Details...</div>;
    if (!book) return <div className="p-20 text-center">Book Not Found</div>;

    // --- SMART STYLING LOGIC ---
    const isRTL = ['arabic', 'urdu', 'persian'].includes(book.language?.name?.toLowerCase());
    const langClass = isRTL ? 'font-arabic text-right dir-rtl' : (book.language?.name?.toLowerCase() === 'hindi' ? 'font-hindi' : 'font-sans');

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header / Breadcrumb */}
            <div className="bg-slate-50 border-b border-slate-200 py-4 px-6">
                <div className="max-w-7xl mx-auto flex items-center text-sm text-slate-500">
                    <Link to="/books" className="hover:text-emerald-600 transition-colors">Library</Link>
                    <span className="mx-2">/</span>
                    <span className="text-slate-900 font-medium truncate">{book.title}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* LEFT: Book Cover (4 Cols) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-10">
                            <div className="bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 group">
                                <img 
                                    src={getBookCover(book)} 
                                    alt={book.title}
                                    className="w-full h-auto rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
                                />
                            </div>
                            
                            {/* Quick Action Buttons */}
                            <div className="mt-8 space-y-3">
                                {book.pdf_url ? (
                                    <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                                        📥 DOWNLOAD PDF
                                    </button>
                                ) : (
                                    <div className="text-center p-4 bg-slate-50 rounded-xl text-slate-400 text-sm border border-dashed">
                                        Digital version not available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Details (8 Cols) */}
                    <div className="lg:col-span-8">
                        {/* Title Section */}
                        <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full mb-4 uppercase tracking-widest">
                                {book.language?.name || 'General'}
                            </span>
                            <h1 className={`text-4xl md:text-5xl font-black text-slate-900 mb-4 ${langClass}`}>
                                {book.title}
                            </h1>
                            <p className="text-xl text-slate-500 font-medium italic">
                                — By {book.author || "Unknown Author"}
                            </p>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-8 border-y border-slate-100">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Publisher</p>
                                <p className="text-slate-900 font-semibold">{book.publisher || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Edition</p>
                                <p className="text-slate-900 font-semibold">{book.edition || '1st Edition'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">ISBN</p>
                                <p className="text-slate-900 font-semibold">{book.isbn || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="py-10">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-emerald-500 pl-3">
                                Description
                            </h3>
                            <div className={`text-lg leading-relaxed text-slate-600 ${langClass}`}>
                                {book.description || "No description available for this title."}
                            </div>
                        </div>

                        {/* PDF Viewer (If Available) */}
                        {book.pdf_url && (
                            <div className="mt-10 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                                <div className="bg-slate-200 p-4 font-bold text-sm text-slate-700">PREVIEW MODE</div>
                                <div style={{ height: '750px' }}>
                                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                                        <Viewer fileUrl={getCoverUrl(book.pdf_url)} plugins={[defaultLayoutPluginInstance]} />
                                    </Worker>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookDetail;