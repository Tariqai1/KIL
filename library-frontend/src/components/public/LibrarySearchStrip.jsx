import React, { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- Debounce Hook ---------------- */
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};

/* ---------------- Main Component ---------------- */
const LibrarySearchStrip = ({
  searchTerm = "",
  onSearchChange,
  suggestions = [],
  loading = false,
}) => {
  const [localValue, setLocalValue] = useState(searchTerm);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [listening, setListening] = useState(false);

  const inputRef = useRef(null);
  const debouncedValue = useDebounce(localValue, 300);

  /* -------- Apply debounced value -------- */
  useEffect(() => {
    onSearchChange?.(debouncedValue);
  }, [debouncedValue]);

  /* -------- Keyboard Shortcut (Ctrl/⌘ + K) -------- */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* -------- Voice Search -------- */
  const startVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice search not supported in this browser");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setListening(true);

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setLocalValue(text);
      setShowSuggestions(false);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-4 py-5">

        {/* ================= SEARCH BAR ================= */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <motion.div
            whileFocusWithin={{
              scale: 1.02,
              boxShadow: "0 10px 35px rgba(45,137,200,0.18)",
            }}
            className="flex items-center bg-gray-50 border rounded-2xl"
          >
            <MagnifyingGlassIcon className="w-6 h-6 ml-4 text-gray-400" />

            <input
              ref={inputRef}
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Search books, authors, publishers..."
              className="flex-1 px-4 py-4 bg-transparent outline-none"
            />

            {/* Voice */}
            <button
              onClick={startVoiceSearch}
              className={`p-2 rounded-full mr-1 ${
                listening ? "bg-red-100 animate-pulse" : "hover:bg-gray-200"
              }`}
            >
              <MicrophoneIcon className="w-5 h-5 text-gray-600" />
            </button>

            {/* Clear */}
            <AnimatePresence>
              {localValue && (
                <motion.button
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  onClick={() => setLocalValue("")}
                  className="p-2 rounded-full hover:bg-gray-200 mr-2"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ================= SUGGESTIONS ================= */}
          <AnimatePresence>
            {showSuggestions && localValue && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute w-full mt-2 bg-white rounded-xl shadow-xl border overflow-hidden"
              >
                {suggestions.slice(0, 5).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLocalValue(item);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
                  >
                    {item}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= SKELETON ================= */}
          {loading && (
            <div className="absolute w-full mt-2 bg-white rounded-xl shadow border p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* ================= HINT ================= */}
        <p className="text-xs text-gray-500 mt-2 pl-2">
          ⌘ / Ctrl + K • Voice Search • Live Results
        </p>
      </div>
    </div>
  );
};

export default LibrarySearchStrip;
