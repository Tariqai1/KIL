import React, { useState } from "react";
import {
  ShieldCheckIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  NoSymbolIcon,
  ClockIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";

const PolicyStatement = ({ onAccept, onCancel }) => {
  const [agreed, setAgreed] = useState(true);

  return (
    <div className="p-8 md:p-10 w-full h-full flex flex-col bg-white">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>

          <div>
            <h2 className="text-2xl font-extrabold text-[#002147]">
              Digital Access Policy
            </h2>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">
              Terms of Service
            </p>
          </div>
        </div>

        <ShieldCheckIcon className="w-9 h-9 text-blue-600 opacity-30 hidden sm:block" />
      </div>

      {/* CONTENT */}
      <div className="flex-1 space-y-6 text-sm text-gray-600 overflow-y-auto">

        <PolicyPoint
          icon={<LockClosedIcon />}
          title="1. Restricted Digital Access"
          text="This book is restricted. Access is provided only for educational and research purposes."
          color="blue"
        />

        <PolicyPoint
          icon={<NoSymbolIcon />}
          title="2. No Sharing or Distribution"
          text="Sharing content, screenshots, PDFs, or login credentials is strictly prohibited."
          color="amber"
        />

        <PolicyPoint
          icon={<ClockIcon />}
          title="3. Time-Limited Access"
          text="Access is temporary and may expire automatically after a fixed duration."
          color="rose"
        />

        <PolicyPoint
          icon={<ScaleIcon />}
          title="4. Ethical & Islamic Usage"
          text="All content must be used ethically and in accordance with Islamic and academic principles."
          color="emerald"
        />

        <div className="bg-slate-50 p-4 rounded-xl border text-right font-urdu">
          آپ اس بات سے اتفاق کرتے ہیں کہ یہ مواد صرف تعلیمی مقاصد کے لیے ہے اور اس
          کی نقل یا اشاعت ممنوع ہے۔
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-8 space-y-4">
        <label className="flex items-start gap-3 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          />
          I confirm that I have read and understood the policy.
        </label>

        <div className="flex gap-3">
          <button
            disabled={!agreed}
            onClick={onAccept}
            className={`flex-1 py-3 rounded-xl font-bold ${
              agreed
                ? "bg-[#002147] text-white hover:bg-blue-900"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            I Agree & Continue
          </button>

          <button
            onClick={onCancel}
            className="px-6 py-3 text-gray-400 font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const PolicyPoint = ({ icon, title, text, color }) => (
  <div className="flex gap-4">
    <div className={`p-2 bg-${color}-50 rounded-lg`}>
      {React.cloneElement(icon, {
        className: `w-5 h-5 text-${color}-600`,
      })}
    </div>
    <div>
      <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
      <p className="mt-1">{text}</p>
    </div>
  </div>
);

export default PolicyStatement;
