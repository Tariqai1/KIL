// src/components/UrduEditor/PageSetupModal.jsx
import React, { useEffect, useState } from "react";
import { X, Check } from "lucide-react";

export const PAGE_SIZES = {
  a4: { name: "A4 (21 x 29.7 cm)", widthMm: 210, heightMm: 297 },
  a5: { name: "A5 (14.8 x 21 cm)", widthMm: 148, heightMm: 210 },
  letter: { name: "Letter (21.6 x 27.9 cm)", widthMm: 216, heightMm: 279 },
  legal: { name: "Legal (21.6 x 35.6 cm)", widthMm: 216, heightMm: 356 },
};

export default function PageSetupModal({ isOpen, onClose, currentSettings, onSave }) {
  const [settings, setSettings] = useState({
    size: "a4",
    orientation: "portrait",
    margins: { top: 2.54, bottom: 2.54, left: 2.54, right: 2.54 },
    bgColor: "#ffffff",
  });

  useEffect(() => {
    if (isOpen && currentSettings) {
      setSettings(currentSettings);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleMarginChange = (side, value) => {
    setSettings((prev) => ({
      ...prev,
      margins: { ...prev.margins, [side]: parseFloat(value) || 0 },
    }));
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-[450px] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-[#2b579a] text-white px-4 py-3 flex justify-between items-center">
          <span className="font-semibold text-sm">Page Setup (صفحہ کی ترتیبات)</span>
          <button onClick={onClose} className="hover:bg-white/20 rounded p-1 transition">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-sm text-gray-700">
          {/* Orientation */}
          <div>
            <label className="block font-bold mb-2 text-xs uppercase text-gray-500">
              Orientation (سمت)
            </label>
            <div className="flex gap-4">
              <label
                className={`flex-1 border rounded p-3 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                  settings.orientation === "portrait"
                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="orientation"
                  value="portrait"
                  checked={settings.orientation === "portrait"}
                  onChange={() => handleChange("orientation", "portrait")}
                  className="hidden"
                />
                <div className="w-6 h-8 border-2 border-current rounded-sm"></div>
                <span>Portrait (عمودي)</span>
              </label>

              <label
                className={`flex-1 border rounded p-3 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                  settings.orientation === "landscape"
                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="orientation"
                  value="landscape"
                  checked={settings.orientation === "landscape"}
                  onChange={() => handleChange("orientation", "landscape")}
                  className="hidden"
                />
                <div className="w-8 h-6 border-2 border-current rounded-sm"></div>
                <span>Landscape (أفقي)</span>
              </label>
            </div>
          </div>

          {/* Paper Size & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1.5 text-xs uppercase text-gray-500">
                Paper Size (سائز)
              </label>
              <select
                value={settings.size}
                onChange={(e) => handleChange("size", e.target.value)}
                className="w-full border border-gray-300 rounded p-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              >
                {Object.entries(PAGE_SIZES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-xs uppercase text-gray-500">
                Page Color (رنگ)
              </label>
              <div className="flex items-center gap-2 border border-gray-300 rounded p-1.5 pl-3">
                <input
                  type="color"
                  value={settings.bgColor}
                  onChange={(e) => handleChange("bgColor", e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-none bg-transparent p-0"
                />
                <span className="text-gray-500 text-xs">{settings.bgColor}</span>
              </div>
            </div>
          </div>

          {/* Margins */}
          <div>
            <label className="block font-bold mb-2 text-xs uppercase text-gray-500">
              Margins (cm) (حاشیہ)
            </label>

            <div className="grid grid-cols-2 gap-4">
              {["top", "bottom", "left", "right"].map((side) => (
                <div key={side} className="flex items-center gap-2">
                  <span className="w-12 text-gray-500 text-xs capitalize">{side}:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.margins[side]}
                    onChange={(e) => handleMarginChange(side, e.target.value)}
                    className="flex-1 border border-gray-300 rounded p-1.5 focus:border-blue-500 outline-none text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded text-sm font-medium transition"
          >
            Cancel (منسوخ)
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center gap-2 transition shadow-sm"
          >
            <Check size={16} /> OK (محفوظ کریں)
          </button>
        </div>
      </div>
    </div>
  );
}
