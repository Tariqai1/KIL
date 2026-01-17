import React, { useState } from 'react';
import { AccessForm } from './AccessForm';
import SuccessScreen from './SuccessScreen'; // Next step mein ye file denge
import { XMarkIcon } from '@heroicons/react/24/outline';

const RestrictedRequestManager = ({ book, onClose }) => {
    // State to toggle between Form and Success Message
    const [view, setView] = useState('form'); // 'form' or 'success'

    return (
        // --- 1. Backdrop (Dark Blur Background) ---
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
            
            {/* --- 2. Modal Wrapper --- */}
            <div className="relative w-full max-w-4xl mx-auto z-10 animate-in zoom-in-95 duration-300">
                
                {/* Close Button (Form ke bahar taaki user aasani se band kar sake) */}
                {view === 'form' && (
                    <button 
                        onClick={onClose}
                        className="absolute -top-12 right-0 md:-right-12 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 group"
                        title="Close Modal"
                    >
                        <XMarkIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </button>
                )}

                {/* --- 3. View Switcher Logic --- */}
                {view === 'form' ? (
                    // Agar Form hai to AccessForm dikhayein
                    <AccessForm 
                        book={book} 
                        onSuccess={() => setView('success')} 
                        onCancel={onClose} 
                    />
                ) : (
                    // Agar Success hai to SuccessScreen dikhayein
                    <SuccessScreen onClose={onClose} />
                )}

            </div>
        </div>
    );
};

export default RestrictedRequestManager;