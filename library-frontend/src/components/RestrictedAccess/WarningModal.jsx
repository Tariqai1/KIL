import React from 'react';
import { ShieldAlert, Info, XCircle, LockKeyhole } from 'lucide-react'; // Lucide icons ka istemal

export const WarningModal = ({ onProceed, onCancel }) => {
    return (
        <div className="bg-white rounded-3xl shadow-2xl border-t-[12px] border-red-700 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header section with Icon */}
            <div className="p-8 text-center bg-red-50/50">
                <div className="mx-auto bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
                    <ShieldAlert className="w-12 h-12 text-red-700" />
                </div>
                
                <h2 className="text-3xl md:text-4xl font-black text-red-800 mb-2 urdu-nastaliq tracking-tight">
                    🛑 انتباہ برائے تحفظِ عقیدہ
                </h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                    Security Warning & Intellectual Property Protection
                </p>
            </div>

            {/* Content Section (Scrollable for mobile) */}
            <div className="px-8 pb-4 overflow-y-auto custom-scrollbar">
                <div className="text-right space-y-5 text-slate-700 leading-relaxed bg-white p-6 rounded-2xl border-2 border-red-100 shadow-sm">
                    <div className="flex items-start gap-3 justify-end">
                        <p className="text-lg font-bold text-slate-800 urdu-nastaliq">عزیز قاری!</p>
                        <Info className="w-5 h-5 text-red-600 mt-2" />
                    </div>

                    <p className="urdu-nastaliq text-xl leading-loose text-justify" dir="rtl">
                        جس مقام پر آپ داخل ہونے کے خواہاں ہیں، یہ سیکشن <strong>'عمومی مطالعہ'</strong> کے لیے نہیں ہے۔ یہاں موجود مواد اہلِ ہوائے نفس اور مبتدعین کی تحریرات پر مشتمل ہے، جس میں حق و باطل کی آمیزش اور گمراہ کن شبہات کا تلاطم ہے۔
                    </p>

                    <div className="p-4 bg-amber-50 rounded-xl border-r-4 border-amber-500">
                        <p className="urdu-nastaliq text-lg leading-loose text-justify text-amber-900" dir="rtl">
                            ہماری اولین ترجیح ایمان اور عقیدۂ توحید و سنت کی حفاظت ہے۔ لہٰذا یہ حصہ صرف ان <strong>راسخین فی العلم</strong> علمائے کرام اور محققین کے لیے ہے جو حق و باطل میں تمیز کی بصیرت رکھتے ہیں، اور جن کا مقصد رد و ابطالِ باطل ہے۔
                        </p>
                    </div>

                    <p className="font-bold text-red-800 text-lg urdu-nastaliq text-center border-t border-red-100 pt-4" dir="rtl">
                        اگر آپ صاحبِ تحقیق عالم ہیں، تو برائے کرم 'استدعائے اجازت' کا فارم پُر کریں۔
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-8 bg-slate-50 flex flex-col sm:flex-row-reverse gap-4 border-t border-slate-200">
                <button 
                    onClick={onProceed}
                    className="flex-1 px-8 py-4 rounded-xl bg-red-700 text-white hover:bg-red-800 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-3 font-bold text-lg group"
                >
                    <LockKeyhole className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="urdu-nastaliq">فارم پُر کریں (Request Access)</span>
                </button>
                
                <button 
                    onClick={onCancel}
                    className="px-8 py-4 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400 transition-all font-bold flex items-center justify-center gap-2"
                >
                    <XCircle className="w-5 h-5" />
                    <span className="urdu-nastaliq">واپس جائیں</span>
                </button>
            </div>
        </div>
    );
};