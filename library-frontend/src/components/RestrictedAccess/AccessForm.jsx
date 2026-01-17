import React, { useState, useEffect } from 'react';
import { User, Book, PenTool, Send, AlertCircle, Phone, Building2, GraduationCap } from 'lucide-react';
import { PURPOSES } from './types'; 
import axios from 'axios'; 
import toast from 'react-hot-toast'; 

export const AccessForm = ({ book, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        qualification: '',
        institution: '',
        isSalafi: false,
        purpose: [],
        previousWork: '',
        oathAccepted: false,
        
        // Optional Fields (Agar backend schema mein hain to rakhne dein)
        age: '',
        location: '',
        teachers: ''
    });

    // --- 1. Auto-Fill User Data (Optional but Good UX) ---
    useEffect(() => {
        // Agar local storage mein user details hain to auto-fill kar dein
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setFormData(prev => ({
                    ...prev,
                    name: parsed.full_name || parsed.username || '',
                    // Agar phone number save hai to wo bhi utha lein
                }));
            } catch (e) {
                console.error("User parse error", e);
            }
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handlePurposeChange = (purpose) => {
        setFormData(prev => ({
            ...prev,
            purpose: prev.purpose.includes(purpose)
                ? prev.purpose.filter(p => p !== purpose)
                : [...prev.purpose, purpose]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validations
        if (!formData.oathAccepted) {
            toast.error("Barae karam halaf (Oath) confirm karein.");
            return;
        }
        if (formData.purpose.length === 0) {
            toast.error("Kam az kam ek maqsad (Purpose) muntakhab karein.");
            return;
        }

        setLoading(true);
        const loadingToast = toast.loading("Darkhwast bheji ja rahi hai...");

        try {
            // --- 🔑 TOKEN RETRIEVAL (CRITICAL) ---
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Session expire ho gaya hai. Dobara login karein.", { id: loadingToast });
                return;
            }

            // Payload Prep
            const payload = {
                book_id: book.id,
                name: formData.name,
                whatsapp: formData.whatsapp,
                qualification: formData.qualification,
                institution: formData.institution,
                is_salafi: formData.isSalafi,
                purpose: formData.purpose,
                previous_work: formData.previousWork,
                
                // Optional fields safe sending
                age: formData.age || "N/A", 
                location: formData.location || "N/A",
                teachers: formData.teachers || "N/A"
            };

            // --- 🚀 REAL API CALL WITH TOKEN ---
            const response = await axios.post(
                'http://127.0.0.1:8000/api/restricted-requests/submit', 
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`, // 👈 YE HAI WO MISSING CHEEZ
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 201 || response.status === 200) {
                toast.success("Darkhwast kamyabi se jama ho gayi!", { id: loadingToast });
                onSuccess(); // Parent component ko batayein ke kaam ho gaya
            }

        } catch (error) {
            console.error("Submission Error:", error);
            
            if (error.response) {
                // Backend specific errors
                if (error.response.status === 401) {
                    toast.error("Aapka login session khatam ho gaya hai.", { id: loadingToast });
                } else if (error.response.status === 400) {
                    toast.error(error.response.data.detail || "Ghalat maloomat.", { id: loadingToast });
                } else {
                    toast.error("Server Error: " + error.response.status, { id: loadingToast });
                }
            } else {
                toast.error("Network Error: Internet check karein.", { id: loadingToast });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] w-full max-w-4xl mx-auto">
            
            {/* --- Header --- */}
            <div className="bg-emerald-900 p-6 text-white flex justify-between items-center shrink-0">
                <div className="text-right">
                    <h2 className="text-xl md:text-2xl font-bold urdu-nastaliq">خصوصی علمی رسائی کا فارم</h2>
                    <p className="text-emerald-200 text-[10px] uppercase tracking-widest font-bold">Confidential Access Request</p>
                </div>
                <Book className="w-10 h-10 opacity-20" />
            </div>

            {/* --- Scrollable Body --- */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-8 custom-scrollbar bg-slate-50/50">
                
                {/* 1. Introduction */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 border-b-2 border-emerald-100 pb-3 mb-6 justify-end">
                        <h3 className="text-lg font-black text-emerald-800 urdu-nastaliq">حصہ اول: تعارف و اہلیت</h3>
                        <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="rtl">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 urdu-nastaliq flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" /> نام مع ولدیت
                            </label>
                            <input required name="name" value={formData.name} onChange={handleInputChange} type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all urdu-nastaliq" placeholder="مکمل نام لکھیں" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 urdu-nastaliq flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" /> رابطہ نمبر (واٹس ایپ)
                            </label>
                            <input required name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} type="text" dir="ltr" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-right font-mono placeholder:text-slate-400" placeholder="+92 300 1234567" />
                        </div>
                        <div className="md:col-span-1 space-y-2">
                            <label className="text-sm font-bold text-slate-600 urdu-nastaliq flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-slate-400" /> علمی منصب / تعلیمی قابلیت
                            </label>
                            <input required name="qualification" value={formData.qualification} onChange={handleInputChange} type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none urdu-nastaliq" placeholder="فاضل، مفتی، ایم فل، وغیرہ" />
                        </div>
                        <div className="md:col-span-1 space-y-2">
                            <label className="text-sm font-bold text-slate-600 urdu-nastaliq flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-400" /> تعلیمی ادارہ / جامعہ
                            </label>
                            <input required name="institution" value={formData.institution} onChange={handleInputChange} type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none urdu-nastaliq" placeholder="جامعہ کا نام لکھیں" />
                        </div>
                    </div>
                </section>

                {/* 2. Purpose */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 border-b-2 border-emerald-100 pb-3 mb-6 justify-end">
                        <h3 className="text-lg font-black text-emerald-800 urdu-nastaliq">حصہ دوم: مقصدِ مطالعہ</h3>
                        <AlertCircle className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div className="space-y-4" dir="rtl">
                        <label className="text-sm font-bold text-slate-600 urdu-nastaliq block mb-2">مطالعے کا شرعی مقصد (ایک یا زائد منتخب کریں):</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {PURPOSES.map((p) => (
                                <label key={p} className={`relative flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all hover:shadow-md ${formData.purpose.includes(p) ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                                    <span className="urdu-nastaliq text-sm font-bold leading-6">{p}</span>
                                    <input type="checkbox" checked={formData.purpose.includes(p)} onChange={() => handlePurposeChange(p)} className="w-5 h-5 accent-emerald-600" />
                                </label>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. The Oath */}
                <section className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-200/60 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 justify-end text-amber-900">
                        <h3 className="text-xl font-black urdu-nastaliq">حصہ سوم: شرعی عہد نامہ</h3>
                        <PenTool className="w-5 h-5" />
                    </div>

                    <div className="bg-white/60 p-6 rounded-2xl urdu-nastaliq text-lg leading-loose text-slate-800 text-justify border border-amber-200/50 backdrop-blur-sm" dir="rtl">
                        "میں اللہ رب العزت کو حاضر و ناظر جان کر یہ اقرار کرتا ہوں کہ ان کتب کے مطالعے سے میرا مقصد اپنی ذات کے لیے ہدایت تلاش کرنا نہیں، بلکہ باطل کا علمی تعاقب کرنا ہے۔ میں اس مواد کو فتنے پھیلانے یا کسی کم علم تک پہنچانے کے لیے استعمال نہیں کروں گا۔"
                    </div>

                    <label className={`flex items-center gap-4 cursor-pointer p-4 rounded-2xl shadow-lg transform active:scale-[0.98] transition-all border ${formData.oathAccepted ? 'bg-emerald-800 text-white border-emerald-900' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'}`}>
                        <input type="checkbox" required checked={formData.oathAccepted} onChange={handleInputChange} name="oathAccepted" className="w-6 h-6 accent-emerald-500" />
                        <span className="urdu-nastaliq font-bold select-none">میں اس عہد کی پاسداری کا حلف اٹھاتا ہوں۔</span>
                    </label>
                </section>
            </div>

            {/* --- Footer --- */}
            <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-10">
                <button type="submit" disabled={!formData.oathAccepted || loading} className="flex-[2] bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:-translate-y-1">
                    {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-5 h-5" /><span className="urdu-nastaliq text-lg">درخواست جمع کروائیں</span></>}
                </button>
                <button type="button" onClick={onCancel} disabled={loading} className="flex-1 border-2 border-slate-200 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all urdu-nastaliq text-lg">
                    منسوخ
                </button>
            </div>
        </form>
    );
};