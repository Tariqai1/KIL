import React, { useEffect, useState } from "react";
import { getAIHelp } from "../../api/geminiService";

const AIAssistant = ({ onClose, onInsert }) => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Vite ENV Key
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // ✅ Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setResponse("براہ کرم اپنا سوال لکھیں۔");
      return;
    }

    setIsLoading(true);
    setResponse("");

    try {
      const res = await getAIHelp(
        API_KEY,
        prompt,
        "Answer in professional Urdu for a book writer. Improve grammar, style and make it readable."
      );

      setResponse(res || "کوئی جواب نہیں ملا۔");
    } catch (err) {
      setResponse("Error: " + (err?.message || "Something went wrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    if (!response.trim()) return;

    // Insert as paragraph (clean)
    const html = `<p>${response.replace(/\n/g, "<br/>")}</p>`;
    onInsert?.(html);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------------- Header ---------------- */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <i className="fas fa-robot"></i> AI Assistant
          </h3>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition"
            title="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* ---------------- Body ---------------- */}
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          {/* Prompt */}
          <label className="text-xs text-gray-500 block mb-2 text-right">
            AI سے پوچھیں
          </label>

          <textarea
            className="w-full border border-gray-200 p-3 rounded-xl text-right mb-3 focus:ring-2 focus:ring-purple-200 outline-none font-['Noto_Nastaliq_Urdu']"
            rows={4}
            placeholder="مثال: ایک خوبصورت تمہید لکھیں..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            dir="rtl"
            onKeyDown={(e) => {
              // Ctrl + Enter => Generate
              if (e.ctrlKey && e.key === "Enter") {
                handleGenerate();
              }
            }}
          />

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-60"
          >
            {isLoading ? "Generating..." : "Generate"}
          </button>

          {/* Response */}
          {response && (
            <div className="mt-4 bg-gray-50 p-4 rounded-xl border text-right">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">AI Response</p>
                <p className="text-[10px] text-gray-400">
                  Ctrl + Enter = Generate
                </p>
              </div>

              <div className="text-gray-800 leading-loose font-['Noto_Nastaliq_Urdu'] whitespace-pre-wrap">
                {response}
              </div>

              <button
                onClick={handleInsert}
                className="mt-3 text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-xl w-full font-bold transition"
              >
                <i className="fas fa-plus ml-1"></i> Insert into Editor
              </button>
            </div>
          )}

          {/* Missing Key Warning */}
          {!API_KEY && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm text-right">
              ⚠️ API Key missing! <br />
              `.env` میں یہ add کریں: <br />
              <span className="font-mono text-xs">
                VITE_GEMINI_API_KEY=YOUR_KEY_HERE
              </span>
            </div>
          )}
        </div>

        {/* ---------------- Footer ---------------- */}
        <div className="border-t bg-white px-4 py-2 text-[11px] text-gray-500 flex justify-between">
          <span>Urdu Writer Mode</span>
          <span className="text-purple-600 font-bold">Gemini AI</span>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
