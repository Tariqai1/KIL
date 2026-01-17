// src/pages/AuditLogPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { logService } from "../api/logService";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters UI state
  const [filterUserId, setFilterUserId] = useState("");
  const [filterActionType, setFilterActionType] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("");
  const [searchText, setSearchText] = useState("");

  // Applied filters state (Server side filter ke liye)
  const [appliedFilters, setAppliedFilters] = useState({
    userId: "",
    actionType: "",
    targetType: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [hasNextPage, setHasNextPage] = useState(true);

  // --- HELPER FUNCTIONS ---
  
  const safeText = (v) => (v === null || v === undefined ? "" : String(v));

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    try {
      const d = new Date(value);
      return isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
    } catch {
      return "N/A";
    }
  };

  // Color Coding for Actions
  const actionBadgeClass = (actionType) => {
    const a = (actionType || "").toUpperCase();
    if (a.includes("CREATED") || a.includes("ADD")) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (a.includes("UPDATED") || a.includes("EDIT")) return "bg-blue-50 text-blue-700 border border-blue-200";
    if (a.includes("DELETED") || a.includes("REMOVE")) return "bg-red-50 text-red-700 border border-red-200";
    if (a.includes("LOGIN") || a.includes("AUTH")) return "bg-purple-50 text-purple-700 border border-purple-200";
    return "bg-slate-50 text-slate-700 border border-slate-200";
  };

  // --- API CALLS ---

  const fetchLogs = async (page, filters) => {
    setIsLoading(true);
    setError("");
    const skip = (page - 1) * itemsPerPage;

    try {
      const payload = {
        limit: itemsPerPage,
        skip,
        userId: filters.userId ? parseInt(filters.userId, 10) : undefined,
        actionType: filters.actionType || undefined,
        targetType: filters.targetType || undefined,
      };

      const data = await logService.getLogs(payload);

      // Data Validation
      if (Array.isArray(data)) {
        setLogs(data);
        setHasNextPage(data.length === itemsPerPage);
      } else {
        setLogs([]);
        setHasNextPage(false);
      }
      setCurrentPage(page);
    } catch (err) {
      console.error("Fetch error:", err);
      setLogs([]);
      setError("Failed to load logs. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Load + Filter Change Listener
  useEffect(() => {
    fetchLogs(currentPage, appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, currentPage]);

  // --- HANDLERS ---

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setAppliedFilters({
      userId: filterUserId.trim(),
      actionType: filterActionType.trim(),
      targetType: filterTargetType.trim(),
    });
  };

  const handleClearFilters = () => {
    setFilterUserId("");
    setFilterActionType("");
    setFilterTargetType("");
    setSearchText("");
    setCurrentPage(1);
    setAppliedFilters({ userId: "", actionType: "", targetType: "" });
  };

  // Client-Side Search (Jo data screen par hai usme dhundna)
  const filteredLogs = useMemo(() => {
    if (!searchText.trim()) return logs;
    const q = searchText.trim().toLowerCase();
    return logs.filter((log) => {
      const joined = [
        log.action_type,
        log.description,
        log.target_type,
        log.action_by?.username,
      ].map(safeText).join(" ").toLowerCase();
      return joined.includes(q);
    });
  }, [logs, searchText]);

  // --- RENDER ---

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Audit Logs</h1>
          <p className="text-slate-500 mt-1">Track system security and user activities.</p>
        </div>
        <button
          onClick={() => fetchLogs(currentPage, appliedFilters)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors shadow-sm font-medium"
        >
          <ArrowPathIcon className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleApplyFilters} className="space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-2 mb-4">
            <FunnelIcon className="h-5 w-5 text-emerald-600" />
            <span>Advanced Filters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* User ID Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">User ID</label>
              <input
                type="number"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                placeholder="e.g. 15"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            {/* Action Type Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Action</label>
              <input
                type="text"
                value={filterActionType}
                onChange={(e) => setFilterActionType(e.target.value)}
                placeholder="e.g. DELETE"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
             {/* Target Type Input */}
             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target</label>
              <input
                type="text"
                value={filterTargetType}
                onChange={(e) => setFilterTargetType(e.target.value)}
                placeholder="e.g. BOOK"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
             {/* Local Search Input */}
             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quick Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Type to filter results..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
              Apply Filters
            </button>
            <button type="button" onClick={handleClearFilters} disabled={isLoading} className="px-6 py-2 bg-white text-slate-600 font-bold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Clear All
            </button>
          </div>
        </form>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl flex items-center gap-3">
          <XMarkIcon className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4 w-1/3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">Loading data...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">No logs found matching your criteria.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{formatDateTime(log.timestamp || log.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{log.action_by?.username || "System"}</div>
                      <div className="text-xs text-slate-400">ID: {log.action_by_id || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${actionBadgeClass(log.action_type)}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{log.target_type || "-"}</div>
                      <div className="text-xs text-slate-400">ID: {log.target_id || "-"}</div>
                    </td>
                    <td className="px-6 py-4 text-xs leading-relaxed">{log.description || "No description provided."}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoading} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 disabled:opacity-50 text-sm font-medium hover:bg-slate-50">
            Previous
          </button>
          <span className="text-sm font-bold text-slate-600">Page {currentPage}</span>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={!hasNextPage || isLoading} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 disabled:opacity-50 text-sm font-medium hover:bg-slate-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;