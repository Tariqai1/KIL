import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  QrCodeIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import { donationService } from "../../api/donationService";

const API_BASE_URL = "http://127.0.0.1:8000";
const DonationPanel = () => {
  const [activeTab, setActiveTab] = useState("qr");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await donationService.getDonationDetails();
        setData(result);
      } catch {
        console.error("Failed to load donation info");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getImageUrl = (p) =>
    !p ? null : p.startsWith("http") ? p : `${API_BASE_URL}${p}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-xl font-extrabold text-[#002147]">
          Support the Library
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Your contribution helps us grow
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-3 bg-slate-50 border-b border-slate-100">
        <TabButton
          active={activeTab === "qr"}
          onClick={() => setActiveTab("qr")}
          label="QR"
        />
        <TabButton
          active={activeTab === "bank"}
          onClick={() => setActiveTab("bank")}
          label="Bank"
        />
        <TabButton
          active={activeTab === "appeal"}
          onClick={() => setActiveTab("appeal")}
          label="Appeal"
        />
      </div>

      {/* Content */}
      <div className="p-4 bg-white min-h-[280px] flex items-center justify-center">
        {loading ? (
          <div className="text-sm text-slate-400">Loading…</div>
        ) : (
          <>
            {activeTab === "qr" && (
              <PanelImage
                desktop={data?.qr_code_desktop}
                mobile={data?.qr_code_mobile}
                getImageUrl={getImageUrl}
              />
            )}
            {activeTab === "bank" && (
              <PanelImage
                desktop={data?.bank_desktop}
                mobile={data?.bank_mobile}
                getImageUrl={getImageUrl}
              />
            )}
            {activeTab === "appeal" && (
              <PanelImage
                desktop={data?.appeal_desktop}
                mobile={data?.appeal_mobile}
                getImageUrl={getImageUrl}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 text-center text-xs text-slate-400 border-t border-slate-100">
        JazakAllah Khair for your support
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2 rounded-lg text-sm font-bold transition border ${
      active
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
    }`}
  >
    {label}
  </button>
);
const PanelImage = ({ desktop, mobile, getImageUrl }) => (
  <>
    <div className="hidden md:block text-center">
      {desktop ? (
        <img
          src={getImageUrl(desktop)}
          className="max-w-full max-h-[50vh] mx-auto rounded-xl border border-slate-200 shadow-sm"
        />
      ) : (
        <NoImage />
      )}
    </div>

    <div className="md:hidden">
      {mobile ? (
        <img
          src={getImageUrl(mobile)}
          className="w-full rounded-xl border border-slate-200 shadow-sm"
        />
      ) : (
        <NoImage />
      )}
    </div>
  </>
);

const NoImage = () => (
  <div className="py-20 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400">
    No Image Found
  </div>
);

export default DonationPanel;
