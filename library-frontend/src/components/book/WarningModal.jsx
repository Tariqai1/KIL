import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Lock, X, BookOpenCheck, ShieldAlert, CheckCircle2, Ban } from 'lucide-react';

const WarningModal = ({ isOpen, onProceed, onCancel }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-sm">
                
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative flex flex-col max-h-[90vh]"
                >
                    {/* ==============================================
                        HEADER SECTION
                       ============================================== */}
                    <div className="bg-white border-b border-slate-100 p-6 flex items-start justify-between shrink-0 z-10 shadow-sm">
                        <button onClick={onCancel} className="mt-2 p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center justify-end gap-5 flex-1 text-right ml-4">
                            <div className="flex flex-col items-end">
                                <h2 className="text-2xl md:text-3xl font-black text-slate-800 font-urdu leading-[1.8] py-1">
                                    لائبریری کی پالیسی اور اصول
                                </h2>
                                <span className="bg-emerald-50 text-emerald-700 text-sm font-bold px-4 py-1.5 rounded-lg border border-emerald-100 font-urdu mt-2 inline-block shadow-sm">
                                    براہ کرم فارم پُر کرنے سے پہلے غور سے پڑھیں
                                </span>
                            </div>

                            <div className="p-3 bg-emerald-100 rounded-2xl shrink-0 border border-emerald-200 shadow-sm">
                                <BookOpenCheck className="w-9 h-9 text-emerald-700" />
                            </div>
                        </div>
                    </div>

                    {/* ==============================================
                        SCROLLABLE CONTENT
                       ============================================== */}
                    <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6 bg-slate-50/50" dir="rtl">
                        
                        {/* 1. WARNING SECTION (Red) */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border-r-4 border-red-500 ring-1 ring-slate-100">
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                                <div className="p-2 bg-red-100 rounded-full shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-red-700 font-urdu pt-1 leading-relaxed">
                                    انتباہ برائے تحفظِ عقیدہ
                                </h3>
                            </div>
                            
                            <div className="text-slate-700 text-lg leading-[2.4rem] text-justify font-urdu space-y-4">
                                <p>
                                    <span className="font-bold text-slate-900">عزیز قاری!</span> جس مقام پر آپ داخل ہونے کے خواہاں ہیں، یہ سیکشن 'عمومی مطالعہ' کے لیے نہیں ہے۔ یہاں موجود مواد اہلِ ہوائے نفس اور مبتدعین کی تحریرات پر مشتمل ہے۔
                                </p>
                                <p>
                                    چونکہ ہماری اولین ترجیح قارئین کے ایمان اور عقیدۂ توحید و سنت کی حفاظت ہے، لہٰذا یہ حصہ صرف ان 
                                    <span className="inline-block font-bold text-emerald-700 bg-emerald-50 px-2 mx-1 rounded border border-emerald-100 py-1 leading-normal">
                                        راسخین فی العلم علمائے کرام
                                    </span>
                                    اور محققین کے لیے مختص کیا گیا ہے جو زہر اور تریاق میں تمیز کرنے کی بصیرت رکھتے ہیں۔
                                </p>
                            </div>
                        </section>

                        {/* 2. POLICY SECTION (Green) */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border-r-4 border-emerald-500 ring-1 ring-slate-100">
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                                <div className="p-2 bg-emerald-100 rounded-full shrink-0">
                                    <ShieldAlert className="w-6 h-6 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-emerald-800 font-urdu pt-1 leading-relaxed">
                                    لائبریری کی جامع پالیسی
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                {/* ✅ Allowed Box (Custom List Fixed) */}
                                <div className="bg-emerald-50/60 p-6 rounded-xl border border-emerald-100">
                                    <strong className="flex items-center gap-3 text-emerald-900 mb-3 font-urdu text-xl border-b border-emerald-200/50 pb-2 leading-relaxed">
                                        <CheckCircle2 className="w-6 h-6 shrink-0" /> 
                                        اہلیت برائے رسائی:
                                    </strong>
                                    
                                    {/* 👇 Custom List with Perfect Alignment & Less Gap */}
                                    <ul className="flex flex-col space-y-1 font-urdu text-lg leading-[2.4rem] text-slate-700">
                                        <li className="flex items-start gap-3">
                                            <span className="mt-3 w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                            <span>عقیدہ و منہج میں پکے سچے اہلِ حدیث / سلفی ہوں۔</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="mt-3 w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                            <span>علمی بصیرت اور حق و باطل میں تمیز کی صلاحیت رکھتے ہوں۔</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="mt-3 w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                            <span>مقصد صرف رد و ابطالِ باطل ہو، نہ کہ ہدایت کی تلاش۔</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* 🚫 Not Allowed Box */}
                                <div className="bg-red-50/60 p-6 rounded-xl border border-red-100">
                                    <strong className="flex items-center gap-3 text-red-900 mb-3 font-urdu text-xl border-b border-red-200/50 pb-2 leading-relaxed">
                                        <Ban className="w-6 h-6 shrink-0" /> 
                                        عوام کے لیے ممانعت:
                                    </strong>
                                    <p className="text-slate-700 font-urdu text-lg leading-[2.4rem] text-justify">
                                        عام قارئین، مبتدی طلباء اور کم علم افراد کے لیے ان کتب کا مطالعہ سخت منع ہے، کیونکہ یہ ایمان کے لیے زہرِ قاتل ثابت ہو سکتی ہیں، اور سلف نے اس سے سختی سے منع فرمایا ہے۔
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ==============================================
                        FOOTER SECTION
                       ============================================== */}
                    <div className="bg-slate-50 p-5 flex flex-col sm:flex-row gap-4 justify-center sm:justify-end border-t border-slate-200 shrink-0 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)]">
                        <button 
                            onClick={onCancel}
                            className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-white hover:text-slate-800 hover:border-slate-400 transition-all font-bold font-urdu text-lg"
                        >
                            واپس جائیں
                        </button>
                        <button 
                            onClick={onProceed}
                            className="px-8 py-3 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300/50 flex items-center justify-center gap-3 font-bold group transform hover:-translate-y-0.5"
                        >
                            <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="font-urdu text-lg pb-1">شرائط قبول ہیں، فارم کھولیں</span>
                        </button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default WarningModal;