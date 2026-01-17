import React, { useState, useEffect } from 'react';
import { 
    CheckCircle, XCircle, User, Phone, 
    BookOpen, GraduationCap, Building2, 
    History, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const AccessRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/restricted-requests/list');
            setRequests(res.data);
        } catch (err) {
            toast.error("Data load karne mein masla hua");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        const loadingToast = toast.loading('Status update ho raha hai...');
        try {
            await axios.patch(`http://127.0.0.1:8000/api/restricted-requests/${id}/status?status_update=${newStatus}`);
            
            setRequests(prev => 
                prev.map(req => req.id === id ? { ...req, status: newStatus } : req)
            );
            
            toast.success(`Request ${newStatus} ho gayi`, { id: loadingToast });
        } catch (err) {
            toast.error("Status update nahi ho saka", { id: loadingToast });
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
            <Toaster position="top-right" />
            
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-emerald-600" />
                            علمی رسائی کی درخواستیں
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Review and manage restricted book access permissions</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Total Pending</p>
                            <p className="text-2xl font-black text-indigo-600">
                                {requests.filter(r => r.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Requests List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
                            <History className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">Abhi tak koi request nahi aayi</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                                <div className="flex flex-col lg:flex-row">
                                    
                                    {/* Sidebar: User Profile */}
                                    <div className={`lg:w-1/4 p-6 ${req.status === 'approved' ? 'bg-emerald-50' : req.status === 'rejected' ? 'bg-red-50' : 'bg-slate-50'}`}>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                                                <User className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 urdu-font text-xl leading-tight">{req.name}</h3>
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
                                                <Phone className="w-4 h-4" />
                                                <span className="text-sm font-mono">{req.whatsapp}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <GraduationCap className="w-4 h-4" />
                                                <span className="text-sm urdu-font leading-none">{req.qualification}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Building2 className="w-4 h-4" />
                                                <span className="text-sm urdu-font leading-none">{req.institution}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content: Reason & Purpose */}
                                    <div className="flex-1 p-8 text-right" dir="rtl">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-black text-slate-400 uppercase flex items-center justify-end gap-2">
                                                    مطالعہ کا مقصد <BookOpen className="w-3 h-3" />
                                                </h4>
                                                <p className="text-slate-700 urdu-font text-lg leading-relaxed bg-slate-50 p-4 rounded-2xl">
                                                    {req.purpose}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-black text-slate-400 uppercase flex items-center justify-end gap-2">
                                                    سابقہ علمی کام <History className="w-3 h-3" />
                                                </h4>
                                                <p className="text-slate-700 urdu-font text-lg leading-relaxed bg-slate-50 p-4 rounded-2xl italic">
                                                    {req.previous_work || "کوئی تفصیل فراہم نہیں کی گئی"}
                                                </p>
                                            </div>
                                        </div>

                                        {req.is_salafi && (
                                            <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100">
                                                <ShieldCheck className="w-4 h-4" />
                                                اہلِ حدیث / سلفی منہج سے وابستگی کا اقرار
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions Section */}
                                    <div className="lg:w-1/5 p-6 bg-white flex flex-row lg:flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-slate-100">
                                        <button 
                                            onClick={() => handleStatusUpdate(req.id, 'approved')}
                                            disabled={req.status === 'approved'}
                                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-30 shadow-lg shadow-emerald-100"
                                        >
                                            <CheckCircle className="w-5 h-5" /> Approve
                                        </button>
                                        <button 
                                            onClick={() => handleStatusUpdate(req.id, 'rejected')}
                                            disabled={req.status === 'rejected'}
                                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 border-2 border-red-100 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-50 transition-all disabled:opacity-30"
                                        >
                                            <XCircle className="w-5 h-5" /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccessRequests;