import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import restrictedBookService from "../../api/restrictedBookService";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // 1) Fetch Notifications (Safe & Reliable)
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await restrictedBookService.getMyRequests();

      // Safety: If API response is not an array, fallback to empty array
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // 2) Load notifications on first render
  useEffect(() => {
    fetchNotifications();
  }, []);

  // 3) Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Status UI Helper
  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          label: "Approved",
        };
      case "rejected":
        return {
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          bg: "bg-red-50",
          text: "text-red-700",
          label: "Rejected",
        };
      default:
        return {
          icon: <Clock className="w-5 h-5 text-amber-600" />,
          bg: "bg-amber-50",
          text: "text-amber-700",
          label: "Pending",
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 🔔 Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
        title="Notifications"
      >
        <Bell className={`w-6 h-6 ${isOpen ? "text-emerald-600" : "text-slate-600"}`} />

        {/* 🔴 Red Dot (only if notifications exist) */}
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center backdrop-blur-sm">
              <h3 className="font-bold text-slate-800">Notifications</h3>

              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                title="Refresh"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-white">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center gap-3 text-slate-400">
                  <div className="p-3 bg-slate-50 rounded-full">
                    <Bell className="w-6 h-6 opacity-30" />
                  </div>
                  <span className="text-sm font-medium">No new notifications</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((req) => {
                    const style = getStatusStyle(req.status);

                    return (
                      <div
                        key={req.id}
                        className="p-4 hover:bg-slate-50/80 transition-colors flex gap-3 items-start"
                      >
                        {/* Status Icon */}
                        <div className={`mt-1 p-2 rounded-full shrink-0 ${style.bg}`}>
                          {style.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4
                              className="font-bold text-slate-800 text-sm truncate pr-2 leading-tight"
                              title={req.book_title}
                            >
                              {req.book_title || "Unknown Book"}
                            </h4>

                            <span className="text-[10px] text-slate-400 whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded">
                              {new Date(req.updated_at || req.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-slate-100 ${style.text}`}
                            >
                              {style.label}
                            </span>
                          </div>

                          {/* Rejection Reason */}
                          {req.status === "rejected" && req.rejection_reason && (
                            <div className="mt-2 text-xs bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-100 leading-relaxed">
                              <strong className="block text-red-900 mb-1">
                                Reason:
                              </strong>
                              {req.rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
