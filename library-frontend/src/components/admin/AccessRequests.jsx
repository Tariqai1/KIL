import React, { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  PhoneIcon,
  BuildingLibraryIcon,
  ClockIcon,
  ShieldCheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  ChevronUpDownIcon,
  ClipboardDocumentIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

import restrictedBookService from "../../api/restrictedBookService";

// ✅ CONFIG: API Base URL (Make sure this matches your Django Port)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// --- HELPERS ---
const normalizeStatus = (s) => String(s || "").toLowerCase();
const safeText = (v, f = "N/A") => (v && String(v).trim() !== "" ? String(v) : f);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

// ✅ NEW: Image URL Helper
const getCoverUrl = (path) => {
    if (!path) return "https://via.placeholder.com/150x200?text=No+Cover";
    if (path.startsWith("http")) return path; // Already full URL
    // Fix relative path
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
};

const AccessRequests = () => {
  // --- STATE ---
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); 

  // --- MODALS ---
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
  const [viewModal, setViewModal] = useState({ open: false, data: null }); 
  const [rejectionReason, setRejectionReason] = useState("");

  // --- API ---
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await restrictedBookService.getAllRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // --- ACTIONS ---
  const handleApprove = async (id, e) => {
    e?.stopPropagation();
    const toastId = toast.loading("Approving...");
    try {
      await restrictedBookService.updateRequestStatus(id, "approved");
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" } : r));
      toast.success("Access Granted", { id: toastId });
      if(viewModal.open) setViewModal({ open: false, data: null });
    } catch (err) {
      toast.error("Failed to approve", { id: toastId });
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) return toast.error("Reason required");
    const id = rejectModal.requestId;
    const toastId = toast.loading("Rejecting...");
    try {
      await restrictedBookService.updateRequestStatus(id, "rejected", rejectionReason);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected", rejection_reason: rejectionReason } : r));
      toast.success("Request Rejected", { id: toastId });
      setRejectModal({ open: false, requestId: null });
      if(viewModal.open) setViewModal({ open: false, data: null });
    } catch (err) {
      toast.error("Failed to reject", { id: toastId });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  // --- FILTERING & SORTING ---
  const processedRequests = useMemo(() => {
    let data = requests.filter((req) => {
      const status = normalizeStatus(req.status);
      const matchesFilter = filter === "all" || status === normalizeStatus(filter);
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        safeText(req.name).toLowerCase().includes(searchLower) ||
        safeText(req.book_title).toLowerCase().includes(searchLower) ||
        String(req.id).includes(searchLower);
      return matchesFilter && matchesSearch;
    });

    return data.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [requests, filter, searchTerm, sortOrder]);

  // --- STATS ---
  const stats = useMemo(() => ({
      total: requests.length,
      pending: requests.filter(r => normalizeStatus(r.status) === 'pending').length,
      approved: requests.filter(r => normalizeStatus(r.status) === 'approved').length,
      rejected: requests.filter(r => normalizeStatus(r.status) === 'rejected').length,
  }), [requests]);

  // --- BADGE COMPONENT ---
  const StatusBadge = ({ status }) => {
    const s = normalizeStatus(status);
    const config = {
      pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: ClockIcon },
      approved: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircleIcon },
      rejected: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircleIcon },
    };
    const active = config[s] || config.pending;
    const Icon = active.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${active.color}`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="capitalize">{s}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-800">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Requests</h1>
            <p className="text-slate-500 font-medium">Manage permissions for restricted library content</p>
          </div>
          
          <div className="flex gap-3">
             <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center min-w-[80px]">
                <span className="text-[10px] uppercase font-bold text-slate-400">Pending</span>
                <span className="text-xl font-black text-amber-500">{stats.pending}</span>
             </div>
             <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center min-w-[80px]">
                <span className="text-[10px] uppercase font-bold text-slate-400">Approved</span>
                <span className="text-xl font-black text-emerald-500">{stats.approved}</span>
             </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-4 z-30">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {["pending", "approved", "rejected", "all"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  filter === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex w-full md:w-auto gap-3">
            <div className="relative flex-1 md:w-64">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user, book..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>
            <button 
              onClick={fetchRequests} 
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">User Details</th>
                  <th className="p-4">Requested Book</th>
                  <th className="p-4">Purpose & Info</th>
                  <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
                    <div className="flex items-center gap-1">
                       Date <ChevronUpDownIcon className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400">Loading requests...</td></tr>
                ) : processedRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <div className="flex flex-col items-center">
                        <FunnelIcon className="w-12 h-12 text-slate-200 mb-3" />
                        <p className="text-slate-500 font-bold">No requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedRequests.map((req) => (
                    <tr 
                        key={req.id} 
                        className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setViewModal({ open: true, data: req })}
                    >
                      {/* User */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm border border-slate-200">
                            {req.name?.[0] || <UserIcon className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{safeText(req.name)}</div>
                            <div 
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(req.whatsapp); }}
                            >
                                <PhoneIcon className="w-3 h-3" /> {safeText(req.whatsapp)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Book Image Fixed ✅ */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden shadow-sm shrink-0">
                               <img 
                                  src={getCoverUrl(req.book_cover)} 
                                  alt="Cover" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => e.target.src = "https://via.placeholder.com/40x60?text=No+Img"}
                               />
                           </div>
                           <div className="max-w-[180px]">
                              <div className="font-bold text-slate-800 text-sm truncate" title={req.book_title}>{safeText(req.book_title)}</div>
                              <div className="text-xs text-slate-400">ID: #{req.id}</div>
                           </div>
                        </div>
                      </td>

                      {/* Info */}
                      <td className="p-4">
                        <div className="max-w-[200px]">
                           <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mb-1">
                              {req.is_salafi && <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" title="Verified Methodology" />}
                              <span className="truncate">{safeText(req.institution, "No Institution")}</span>
                           </div>
                           <p className="text-sm text-slate-600 truncate">{Array.isArray(req.purpose) ? req.purpose.join(", ") : safeText(req.purpose)}</p>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-sm text-slate-500 font-medium">
                        {formatDate(req.created_at)}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <StatusBadge status={req.status} />
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right pr-6">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                           {normalizeStatus(req.status) === 'pending' ? (
                             <>
                               <button 
                                 onClick={(e) => handleApprove(req.id, e)} 
                                 className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                                 title="Approve"
                               >
                                  <CheckCircleIcon className="w-5 h-5" />
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setRejectModal({ open: true, requestId: req.id }); }} 
                                 className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-100"
                                 title="Reject"
                               >
                                  <XCircleIcon className="w-5 h-5" />
                               </button>
                             </>
                           ) : (
                             <button 
                               onClick={() => setViewModal({ open: true, data: req })}
                               className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                             >
                                <EyeIcon className="w-5 h-5" />
                             </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
             <span>Showing {processedRequests.length} records</span>
          </div>
        </div>
      </div>

      {/* 1. VIEW DETAILS MODAL */}
      <AnimatePresence>
        {viewModal.open && viewModal.data && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setViewModal({open:false, data:null})}>
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
                 onClick={(e) => e.stopPropagation()}
              >
                 <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Request Details</h2>
                        <p className="text-sm text-slate-500">ID: #{viewModal.data.id} • {formatDate(viewModal.data.created_at)}</p>
                    </div>
                    <button onClick={() => setViewModal({open:false, data:null})} className="p-1 hover:bg-slate-200 rounded-full text-slate-400"><XMarkIcon className="w-6 h-6" /></button>
                 </div>

                 <div className="p-6 overflow-y-auto space-y-8">
                    <div className="flex items-center justify-between">
                       <StatusBadge status={viewModal.data.status} />
                       {viewModal.data.is_salafi && (
                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                             <ShieldCheckIcon className="w-4 h-4" /> Methodology Verified
                          </div>
                       )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">User Information</h3>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">{viewModal.data.name?.[0]}</div>
                                <span className="font-bold text-slate-800">{safeText(viewModal.data.name)}</span>
                             </div>
                             <div className="flex items-center gap-2 text-sm text-slate-600">
                                <PhoneIcon className="w-4 h-4 text-slate-400" /> {safeText(viewModal.data.whatsapp)}
                             </div>
                             <div className="flex items-center gap-2 text-sm text-slate-600">
                                <BuildingLibraryIcon className="w-4 h-4 text-slate-400" /> {safeText(viewModal.data.institution)}
                             </div>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Book Requested</h3>
                          <div className="flex gap-4 items-start">
                             {/* ✅ MODAL IMAGE FIXED */}
                             <img 
                                src={getCoverUrl(viewModal.data.book_cover)} 
                                className="w-16 h-24 object-cover rounded-lg shadow-sm bg-slate-100 border border-slate-200" 
                                alt="cover" 
                                onError={(e) => e.target.src = "https://via.placeholder.com/60x90?text=No+Img"}
                             />
                             <div>
                                <h4 className="font-bold text-slate-900">{safeText(viewModal.data.book_title)}</h4>
                                <span className="text-xs text-slate-500 block mt-1">Restricted Content</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Purpose of Study</h3>
                          <div className="p-4 bg-slate-50 rounded-xl text-sm leading-relaxed text-slate-700 border border-slate-100">
                             {safeText(viewModal.data.purpose)}
                          </div>
                       </div>
                       <div>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Previous Work</h3>
                          <div className="p-4 bg-slate-50 rounded-xl text-sm leading-relaxed text-slate-700 border border-slate-100">
                             {safeText(viewModal.data.previous_work)}
                          </div>
                       </div>
                       {viewModal.data.status === 'rejected' && viewModal.data.rejection_reason && (
                           <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                              <h3 className="text-xs font-black text-red-800 uppercase mb-1">Rejection Reason</h3>
                              <p className="text-sm text-red-700">{viewModal.data.rejection_reason}</p>
                           </div>
                       )}
                    </div>
                 </div>

                 {normalizeStatus(viewModal.data.status) === 'pending' && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                       <button 
                          onClick={() => { setRejectModal({ open: true, requestId: viewModal.data.id }); }}
                          className="px-5 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors text-sm"
                       >
                          Reject
                       </button>
                       <button 
                          onClick={() => handleApprove(viewModal.data.id)}
                          className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors text-sm"
                       >
                          Approve Request
                       </button>
                    </div>
                 )}
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* 2. REJECT MODAL */}
      <AnimatePresence>
        {rejectModal.open && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
              >
                 <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
                       <XCircleIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Reject Request</h3>
                    <p className="text-slate-500 text-sm mt-1 mb-4">Please provide a reason. This will be visible to the user.</p>
                    
                    <textarea 
                       autoFocus
                       value={rejectionReason}
                       onChange={(e) => setRejectionReason(e.target.value)}
                       className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
                       placeholder="e.g. Incomplete details provided..."
                    />
                 </div>
                 <div className="p-4 bg-slate-50 flex gap-3">
                    <button onClick={() => setRejectModal({open:false, requestId:null})} className="flex-1 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors text-sm">Cancel</button>
                    <button onClick={handleRejectConfirm} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm">Confirm Reject</button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AccessRequests;