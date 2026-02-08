import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { ClockIcon, ShieldCheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

const SuccessScreen = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative animate-in zoom-in duration-300">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-emerald-50 p-6 rounded-full border">
              <CheckCircleIcon className="w-16 h-16 text-emerald-600" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-2">
            Request Submitted Successfully
          </h2>

          <p className="text-slate-500 mb-8">
            Your request has been sent to the review panel.  
            You will be notified after approval.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <InfoCard
              icon={<ClockIcon className="w-6 h-6" />}
              title="Review Time"
              desc="24–48 hours"
            />
            <InfoCard
              icon={<ShieldCheckIcon className="w-6 h-6" />}
              title="Access Duration"
              desc="Up to 6 months"
            />
          </div>

          <button
            onClick={onClose}
            className="px-10 py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold shadow-lg"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, title, desc }) => (
  <div className="bg-slate-50 border p-5 rounded-2xl flex items-center gap-4 justify-center">
    <div className="text-emerald-600">{icon}</div>
    <div>
      <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  </div>
);

export default SuccessScreen;
