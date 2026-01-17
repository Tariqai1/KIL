import React from 'react';
import { BookOpenIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { getBookCover, getCoverUrl, FALLBACK_COVER } from '../../utils/cover';

const BookCard = ({ book, onRequestAccess }) => {
    const imageSource = getBookCover(book);
    
    // PDF URL banana
    const pdfRaw = book.pdf_url || book.pdf_file;
    const pdfUrl = getCoverUrl(pdfRaw);
    const hasPdf = pdfRaw && pdfUrl !== FALLBACK_COVER;

    const handleReadClick = (e) => {
        e.stopPropagation(); // Card click se bachne ke liye
        if (book.is_restricted) {
            onRequestAccess(book);
        } else if (hasPdf) {
            window.open(pdfUrl, '_blank');
        } else {
            alert("PDF not available");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden group flex flex-col h-full">
            <div className="relative w-full aspect-[2/3] bg-slate-100 overflow-hidden">
                <img 
                    src={imageSource} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_COVER; }}
                />
                {book.is_restricted && (
                    <div className="absolute top-2 right-2 bg-slate-900/90 p-1.5 rounded-full text-white">
                        <LockClosedIcon className="h-3.5 w-3.5" />
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-grow">
                {/* 🔴 FIX: Yahan 'book.category' object nahi, uska naam dikhayenge */}
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full truncate">
                        {book.category?.name || "General"}
                    </span>
                </div>

                <h3 className="font-bold text-slate-800 text-base line-clamp-2 mb-1" title={book.title}>
                    {book.title}
                </h3>
                
                <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                    {book.author || "Unknown Author"}
                </p>

                <div className="mt-auto pt-3 border-t border-slate-50">
                    <button 
                        onClick={handleReadClick}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
                            book.is_restricted 
                            ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                            : "bg-slate-900 text-white hover:bg-emerald-600"
                        }`}
                    >
                        {book.is_restricted ? <><LockClosedIcon className="h-4 w-4"/> Request Access</> : <><BookOpenIcon className="h-4 w-4"/> Read Now</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookCard;