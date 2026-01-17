import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ClockIcon, ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SuccessScreen = ({ onClose }) => {
    return (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl mx-auto border border-slate-100 relative">
            
            {/* Close Button (Top Right) */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
            >
                <XMarkIcon className="w-6 h-6" />
            </button>

            <div className="p-8 md:p-12 text-center">
                
                {/* --- 1. Animated Success Icon --- */}
                <div className="relative inline-flex items-center justify-center mb-8">
                    {/* Outer Ring Animation */}
                    <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-emerald-50 p-6 rounded-full border-2 border-emerald-100 shadow-sm">
                        <CheckCircleIcon className="w-16 h-16 text-emerald-600 animate-in zoom-in duration-500" />
                    </div>
                </div>

                {/* --- 2. Main Heading (Urdu) --- */}
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2 urdu-nastaliq leading-relaxed">
                    درخواست موصول ہو گئی ہے
                </h2>
                <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase mb-8">
                    Request Submitted Successfully
                </p>

                {/* --- 3. Message Body --- */}
                <p className="text-lg text-slate-600 mb-8 urdu-nastaliq leading-loose max-w-lg mx-auto">
                    جزاک اللہ خیراً! آپ کی درخواست ہمارے <span className="font-bold text-slate-900">علمی پینل</span> کو ارسال کر دی گئی ہے۔
                </p>

                {/* --- 4. Info Cards (Timeline & Process) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-right">
                    {/* Card 1: Time */}
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-end gap-4 group hover:border-emerald-200 transition-colors">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm urdu-nastaliq mb-1">جائزہ کا وقت</h4>
                            <p className="text-xs text-slate-500 urdu-nastaliq">انتظامیہ 24 سے 48 گھنٹوں میں جائزہ لے گی۔</p>
                        </div>
                        <div className="bg-white p-3 rounded-full shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                            <ClockIcon className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 2: Approval */}
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-end gap-4 group hover:border-emerald-200 transition-colors">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm urdu-nastaliq mb-1">رسائی کی مدت</h4>
                            <p className="text-xs text-slate-500 urdu-nastaliq">منظوری کی صورت میں رسائی 6 ماہ کے لیے ہوگی۔</p>
                        </div>
                        <div className="bg-white p-3 rounded-full shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                            <ShieldCheckIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* --- 5. Note Box --- */}
                <div className="bg-emerald-50/50 border-r-4 border-emerald-500 p-4 rounded-lg text-right mb-10">
                    <p className="text-sm text-emerald-900 urdu-nastaliq leading-7">
                        <span className="font-bold">انتظامی نوٹ:</span> ہر درخواست کا دستی طور پر (Manually) جائزہ لیا جائے گا۔ آپ کو واٹس ایپ یا ای میل کے ذریعے فیصلے سے آگاہ کر دیا جائے گا۔
                    </p>
                </div>

                {/* --- 6. Action Button --- */}
                <button 
                    onClick={onClose}
                    className="w-full md:w-auto px-10 py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 mx-auto"
                >
                    <span className="urdu-nastaliq text-lg">سمجھ گیا، واپس جائیں</span>
                </button>

            </div>
        </div>
    );
};

export default SuccessScreen;