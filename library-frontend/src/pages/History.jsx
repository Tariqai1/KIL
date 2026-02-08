import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import restrictedBookService from "../api/restrictedBookService";
import {
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";

const History = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ UX states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | approved | pending | rejected
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await restrictedBookService.getMyRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("History fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await restrictedBookService.getMyRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("History refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const safeDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-100">
          <CheckCircle2 size={14} /> APPROVED
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1 rounded-full text-xs font-extrabold border border-red-100">
          <XCircle size={14} /> REJECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-xs font-extrabold border border-amber-100">
        <Clock size={14} /> PENDING
      </span>
    );
  };

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requests
      .filter((req) => {
        // status filter
        const status = (req?.status || "pending").toLowerCase();
        if (statusFilter !== "all" && status !== statusFilter) return false;

        // search filter
        if (!term) return true;

        const title = (req?.book_title || "").toLowerCase();
        const reason = (req?.reason || "").toLowerCase();
        const rejection = (req?.rejection_reason || "").toLowerCase();

        return (
          title.includes(term) ||
          reason.includes(term) ||
          rejection.includes(term) ||
          String(req?.book_id || "").includes(term)
        );
      })
      .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
  }, [requests, search, statusFilter]);

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-56 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-28 bg-slate-200 rounded-xl animate-pulse" />
        </div>

        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="w-16 h-20 bg-slate-200 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="text-emerald-600" />
              My Request History
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Aapki restricted books ki requests ka status yahan milega.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by book title / reason / id..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-semibold text-slate-800"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                <Filter className="w-4 h-4" />
                Status
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 outline-none hover:bg-slate-50 cursor-pointer"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <div className="ml-2 text-xs font-extrabold bg-slate-900 text-white px-3 py-1 rounded-full">
                {filteredRequests.length} Requests
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredRequests.length === 0 ? (
          <div className="text-center p-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 mb-3">
              <AlertCircle className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-bold">
              کوئی ریکارڈ نہیں ملا 😕
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Filters change karke dekho ya library me search karo.
            </p>
            <Link
              to="/books"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 transition"
            >
              <BookOpen size={16} /> Browse Library
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((req) => {
              const status = (req?.status || "pending").toLowerCase();
              const cover = req?.book_cover;
              const title = req?.book_title || "Unknown Book";
              const createdAt = safeDate(req?.created_at);

              return (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                    {/* Left */}
                    <div className="flex items-start gap-4">
                      {/* Cover */}
                      <div className="w-16 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                        {cover ? (
                          <img
                            src={cover}
                            alt={title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <BookOpen size={20} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 truncate max-w-[520px]">
                          {title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 font-semibold">
                            Request Date: <span className="font-bold">{createdAt}</span>
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            • Book ID: {req?.book_id ?? "N/A"}
                          </span>
                        </div>

                        {/* Rejection reason */}
                        {status === "rejected" && req?.rejection_reason && (
                          <div className="mt-3 text-xs text-red-700 bg-red-50 p-3 rounded-xl flex gap-2 items-start border border-red-100">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <span className="leading-relaxed">
                              <strong>وجہ:</strong> {req.rejection_reason}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex flex-col items-start md:items-end gap-2">
                      {getStatusBadge(status)}

                      {status === "approved" ? (
                        <Link
                          to={`/read/${req.book_id}`}
                          className="inline-flex items-center gap-2 text-sm bg-slate-900 text-white px-4 py-2 rounded-xl font-extrabold hover:bg-emerald-600 transition-colors"
                        >
                          <BookOpen size={16} /> Read Now
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold">
                          {status === "pending"
                            ? "Approval ka wait karein..."
                            : "Access denied"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
