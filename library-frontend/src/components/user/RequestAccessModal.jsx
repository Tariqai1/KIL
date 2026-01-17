// src/components/user/RequestAccessModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    XMarkIcon, 
    PaperAirplaneIcon, 
    MapPinIcon, 
    ChatBubbleBottomCenterTextIcon, 
    PhoneIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { bookService } from '../../api/bookService';

const RequestAccessModal = ({ isOpen, onClose, book, onSuccess }) => {
    // --- State Management ---
    const [formData, setFormData] = useState({
        request_reason: '',
        delivery_address: '',
        contact_number: '',
        requested_days: 7
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false); // New state for Success View

    if (!isOpen || !book) return null;

    // --- Handlers ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Error clear karein agar user type kar raha hai
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Client-Side Validation
        if (formData.request_reason.length < 10) {
            setError("Reason must be at least 10 characters long.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await bookService.sendBookRequest({
                book_id: book.id,
                ...formData
            });
            
            // Success Logic
            setIsSuccess(true);
            
            // 2 Second baad modal band karein aur parent ko notify karein
            setTimeout(() => {
                setIsSuccess(false);
                onSuccess(); // Parent (BookDetailsModal) ko batao
                onClose();   // Modal close
                setFormData({ request_reason: '', delivery_address: '', contact_number: '', requested_days: 7 }); // Reset
            }, 2000);

        } catch (err) {
            const msg = err.response?.data?.detail || "Failed to submit request. Please try again.";
            setError(msg);
            setLoading(false);
        }
    };

    // --- Animation Variants ---
    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
        exit: { opacity: 0, scale: 0.95, y: 10 }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 font-sans">
                {/* 1. Backdrop */}
                <motion.div 
                    initial="hidden" animate="visible" exit="hidden" variants={backdropVariants}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* 2. Modal Window */}
                <motion.div 
                    initial="hidden" animate="visible" exit="exit" variants={modalVariants}
                    className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
                >
                    {/* --- VIEW 1: SUCCESS STATE (Animated) --- */}
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center p-10 text-center bg-emerald-50 h-full min-h-[400px]">
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }} 
                                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6"
                            >
                                <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-emerald-800 mb-2">Request Submitted!</h3>
                            <p className="text-emerald-600">The librarian will review your request shortly.</p>
                        </div>
                    ) : (
                        /* --- VIEW 2: FORM STATE --- */
                        <>
                            {/* Header */}
                            <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Request Access</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        For: <span className="font-semibold text-slate-700">{book.title}</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={onClose} 
                                    className="p-1 hover:bg-gray-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Form Body */}
                            <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                                
                                {/* Error Message Box */}
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                        className="mb-5 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2"
                                    >
                                        <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    
                                    {/* 1. Reason Input */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                                            Why do you need this book? <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute top-3 left-3 pointer-events-none text-gray-400 group-focus-within:text-slate-600 transition-colors">
                                                <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
                                            </div>
                                            <textarea
                                                name="request_reason"
                                                rows="3"
                                                required
                                                value={formData.request_reason}
                                                onChange={handleChange}
                                                placeholder="e.g. Need reference for my thesis on Ancient History..."
                                                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm transition-shadow placeholder-gray-400"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 text-right">Min 10 characters</p>
                                    </div>

                                    {/* 2. Address Input */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                                            Delivery Location / Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute top-3 left-3 pointer-events-none text-gray-400 group-focus-within:text-slate-600 transition-colors">
                                                <MapPinIcon className="h-5 w-5" />
                                            </div>
                                            <textarea
                                                name="delivery_address"
                                                rows="2"
                                                required
                                                value={formData.delivery_address}
                                                onChange={handleChange}
                                                placeholder="Room No, Hostel Block, or Department..."
                                                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm transition-shadow placeholder-gray-400"
                                            />
                                        </div>
                                    </div>

                                    {/* 3. Days & Contact Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                                                Days Needed
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-slate-600">
                                                    <CalendarDaysIcon className="h-5 w-5" />
                                                </div>
                                                <input
                                                    type="number"
                                                    name="requested_days"
                                                    min="1" max="30"
                                                    value={formData.requested_days}
                                                    onChange={handleChange}
                                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm transition-shadow"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                                                Contact (Optional)
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-slate-600">
                                                    <PhoneIcon className="h-5 w-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="contact_number"
                                                    placeholder="+91..."
                                                    value={formData.contact_number}
                                                    onChange={handleChange}
                                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm transition-shadow"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="pt-4 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-[2] flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                                        >
                                            {loading ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <PaperAirplaneIcon className="h-4 w-4" />
                                                    Submit Request
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RequestAccessModal;