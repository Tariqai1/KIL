import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    UserIcon, 
    PhoneIcon, 
    BookOpenIcon, 
    AcademicCapIcon, 
    BuildingLibraryIcon, 
    ClockIcon, 
    ShieldCheckIcon,
    EyeIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const AccessRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Rejection Modal State ---
    const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/restricted-requests/list');
            setRequests(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Data load karne mein masla hua");
        } finally {
            setLoading(false);
        }
    };

    // --- 1. Approve Logic (Direct) ---
    const handleApprove = async (id) => {
        const loadingToast = toast.loading('Approving request...');
        try {
            // Approve mein reason ki zaroorat nahi
            await axios.patch(`http://127.0.0.1:8000/api/restricted-requests/${id}/status?status_update=approved`);
            
            setRequests(prev => 
                prev.map(req => req.id === id ? { ...req, status: 'approved', rejection_reason: null } : req)
            );
            
            toast.success("Request Approved!", { id: loadingToast });
        } catch (err) {
            toast.error("Approve nahi ho saka.", { id: loadingToast });
        }
    };

    // --- 2. Reject Click (Open Modal) ---
    const openRejectModal = (id) => {
        setRejectModal({ open: true, requestId: id });
        setRejectionReason(''); // Purana text saaf karein
    };

    // --- 3. Confirm Reject (With Reason) ---
    const handleRejectConfirm = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Bhai, wajah (reason) likhna zaroori hai!");
            return;
        }

        const id = rejectModal.requestId;
        const loadingToast = toast.loading('Rejecting request...');

        try {
            // API Call with Reason
            await axios.patch(
                `http://127.0.0.1:8000/api/restricted-requests/${id}/status?status_update=rejected&rejection_reason=${encodeURIComponent(rejectionReason)}`
            );
            
            setRequests(prev => 
                prev.map(req => req.id === id ? { ...req, status: 'rejected', rejection_reason: rejectionReason } : req)
            );
            
            toast.success("Request Rejected.", { id: loadingToast });
            setRejectModal({ open: false, requestId: null }); // Modal band karein

        } catch (err) {
            toast.error("Reject nahi ho saka.", { id: loadingToast });
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <Toaster position="top-right" />
            
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <ShieldCheckIcon className="w-8 h-8 text-emerald-600" />
                            <span>Access Requests</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage restricted book permissions</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Pending</p>
                            <p className="text-2xl font-black text-indigo-600">
                                {requests.filter(r => r.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </header>

                {/* List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
                            <ClockIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No new requests found</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                                <div className="flex flex-col lg:flex-row">
                                    
                                    {/* User Profile Sidebar */}
                                    <div className={`lg:w-1/4 p-6 ${req.status === 'approved' ? 'bg-emerald-50' : req.status === 'rejected' ? 'bg-red-50' : 'bg-slate-50'}`}>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                                                <UserIcon className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-xl leading-tight">{req.name}</h3>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                    req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                                                    req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <PhoneIcon className="w-4 h-4" />
                                                <span className="text-sm font-mono">{req.whatsapp}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <AcademicCapIcon className="w-4 h-4" />
                                                <span className="text-sm leading-none">{req.qualification}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <BuildingLibraryIcon className="w-4 h-4" />
                                                <span className="text-sm leading-none">{req.institution}</span>
                                            </div>
                                        </div>

                                        {/* Book Preview */}
                                        <div className="mt-6 pt-4 border-t border-slate-200/50">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">Requested Book</h4>
                                            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                                <img 
                                                    src={req.book_cover || "https://via.placeholder.com/50x75"} 
                                                    className="w-10 h-14 object-cover rounded-md"
                                                    alt="cover"
                                                />
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-bold text-slate-800 truncate">{req.book_title}</p>
                                                    <p className="text-[10px] text-slate-400">ID: {req.book_id}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 p-8 text-right" dir="rtl">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-black text-slate-400 uppercase flex items-center justify-end gap-2">
                                                    مطالعہ کا مقصد <BookOpenIcon className="w-3 h-3" />
                                                </h4>
                                                <div className="flex flex-wrap gap-2 justify-end">
                                                    {Array.isArray(req.purpose) ? req.purpose.map((p, i) => (
                                                        <span key={i} className="bg-slate-100 px-3 py-1 rounded-lg text-sm urdu-font">{p}</span>
                                                    )) : <span className="bg-slate-100 px-3 py-1 rounded-lg text-sm urdu-font">{req.purpose}</span>}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-black text-slate-400 uppercase flex items-center justify-end gap-2">
                                                    سابقہ علمی کام <ClockIcon className="w-3 h-3" />
                                                </h4>
                                                <p className="text-slate-700 text-lg leading-relaxed bg-slate-50 p-4 rounded-2xl italic urdu-font">
                                                    {req.previous_work || "کوئی تفصیل فراہم نہیں کی گئی"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rejection Reason Display (Agar Reject ho chuka hai) */}
                                        {req.status === 'rejected' && req.rejection_reason && (
                                            <div className="mt-6 bg-red-50 border border-red-100 p-4 rounded-xl text-right">
                                                <h4 className="text-xs font-black text-red-400 uppercase mb-1">وجہ رد (Rejection Reason):</h4>
                                                <p className="text-red-700 urdu-font">{req.rejection_reason}</p>
                                            </div>
                                        )}

                                        {req.is_salafi && (
                                            <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100">
                                                <ShieldCheckIcon className="w-4 h-4" />
                                                اہلِ حدیث / سلفی منہج سے وابستگی کا اقرار
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions Buttons */}
                                    <div className="lg:w-1/5 p-6 bg-white flex flex-row lg:flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-slate-100">
                                        {/* Approve Button */}
                                        <button 
                                            onClick={() => handleApprove(req.id)}
                                            disabled={req.status === 'approved'}
                                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-100"
                                        >
                                            <CheckCircleIcon className="w-5 h-5" /> Approve
                                        </button>

                                        {/* Reject Button (Opens Modal) */}
                                        <button 
                                            onClick={() => openRejectModal(req.id)}
                                            disabled={req.status === 'rejected'}
                                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 border-2 border-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <XCircleIcon className="w-5 h-5" /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ==============================================
                🔴 REJECTION REASON MODAL
               ============================================== */}
            {rejectModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="bg-red-50 p-6 flex justify-between items-center border-b border-red-100">
                            <h3 className="text-xl font-black text-red-800 flex items-center gap-2">
                                <XCircleIcon className="w-6 h-6" /> Reject Request
                            </h3>
                            <button onClick={() => setRejectModal({ open: false, requestId: null })} className="text-red-400 hover:text-red-700">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <p className="text-slate-600 text-sm font-medium">
                                Barae karam rejection ki wajah likhein taaki user ko aagah kiya ja sake.
                            </p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Wajah yahan likhein (Example: Details na-mukammal hain...)"
                                className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all resize-none text-slate-800"
                                autoFocus
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button 
                                onClick={() => setRejectModal({ open: false, requestId: null })}
                                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleRejectConfirm}
                                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AccessRequests;