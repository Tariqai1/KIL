// src/pages/AuditLogPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { logService } from "../api/logService";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters UI state
  const [filterUserId, setFilterUserId] = useState("");
  const [filterActionType, setFilterActionType] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("");
  const [searchText, setSearchText] = useState("");

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState({
    userId: "",
    actionType: "",
    targetType: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [hasNextPage, setHasNextPage] = useState(true);

  // ----------------------------
  // Helpers
  // ----------------------------
  const safeText = (v) => (v === null || v === undefined ? "" : String(v));

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "N/A";
      return d.toLocaleString();
    } catch {
      return "N/A";
    }
  };

  const extractErrorMessage = (err) => {
    const detail = err?.detail;
    if (typeof detail === "string") return detail;

    // If backend returns { detail: [ {msg}, ... ] }
    if (Array.isArray(detail)) {
      const msg = detail.map((e) => e?.msg).filter(Boolean).join(", ");
      return msg || "Validation error";
    }

    if (typeof err?.message === "string") return err.message;
    return "Could not fetch audit logs.";
  };

  const actionBadgeClass = (actionType) => {
    const a = (actionType || "").toUpperCase();

    if (a.includes("CREATED"))
      return "bg-green-50 text-green-700 ring-1 ring-green-200";
    if (a.includes("UPDATED"))
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    if (a.includes("DELETED"))
      return "bg-red-50 text-red-700 ring-1 ring-red-200";
    if (a.includes("LOGIN") || a.includes("AUTH"))
      return "bg-purple-50 text-purple-700 ring-1 ring-purple-200";
    if (a.includes("APPROVED"))
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

    return "bg-gray-50 text-gray-700 ring-1 ring-gray-200";
  };

  // ----------------------------
  // Fetch Logs (server-side pagination)
  // ----------------------------
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

      setLogs(Array.isArray(data) ? data : []);
      setCurrentPage(page);
      setHasNextPage(Array.isArray(data) && data.length === itemsPerPage);
    } catch (err) {
      setLogs([]);
      setHasNextPage(false);
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Initial + whenever applied filters change
  useEffect(() => {
    fetchLogs(currentPage, appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, currentPage]);

  // ----------------------------
  // Apply Filters
  // ----------------------------
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

    setAppliedFilters({
      userId: "",
      actionType: "",
      targetType: "",
    });
  };

  // ----------------------------
  // Client-side Search (on fetched page only)
  // ----------------------------
  const filteredLogs = useMemo(() => {
    if (!searchText.trim()) return logs;

    const q = searchText.trim().toLowerCase();

    return logs.filter((log) => {
      const joined =
        [
          log?.action_type,
          log?.description,
          log?.target_type,
          log?.target_id,
          log?.action_by?.username,
          log?.action_by_id,
        ]
          .map(safeText)
          .join(" ")
          .toLowerCase() || "";

      return joined.includes(q);
    });
  }, [logs, searchText]);

  // ----------------------------
  // Pagination handlers
  // ----------------------------
  const goNext = () => {
    if (!hasNextPage || isLoading) return;
    setCurrentPage((p) => p + 1);
  };

  const goPrev = () => {
    if (currentPage <= 1 || isLoading) return;
    setCurrentPage((p) => p - 1);
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            📜 Audit Logs
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track system activity: who did what, when, and to which record.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(currentPage, appliedFilters)}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters Card */}
      <form
        onSubmit={handleApplyFilters}
        className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 md:p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          Filters & Search
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="number"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              placeholder="e.g. 1"
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm"
            />
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <input
              type="text"
              value={filterActionType}
              onChange={(e) => setFilterActionType(e.target.value)}
              placeholder="BOOK_CREATED"
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm"
            />
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Type
            </label>
            <input
              type="text"
              value={filterTargetType}
              onChange={(e) => setFilterTargetType(e.target.value)}
              placeholder="Book / User / Role"
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quick Search (current page)
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search description / username / target..."
                disabled={isLoading}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            Apply Filters
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
            Clear
          </button>

          <div className="text-sm text-gray-500 sm:ml-auto">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {filteredLogs.length}
            </span>{" "}
            logs (Page {currentPage})
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            System Activity
          </h3>
          <span className="text-xs text-gray-500">
            Latest events on top
          </span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="p-6 text-center text-gray-500">
            Loading audit logs...
          </div>
        )}

        {/* Empty */}
        {!isLoading && filteredLogs.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No logs found for current filters/search.
          </div>
        )}

        {/* Table Data */}
        {!isLoading && filteredLogs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    {/* Time */}
                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDateTime(log.timestamp || log.created_at)}
                    </td>

                    {/* User */}
                    <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {log?.action_by?.username || "System/Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {log?.action_by_id ?? "N/A"}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${actionBadgeClass(
                          log.action_type
                        )}`}
                      >
                        {log.action_type || "UNKNOWN"}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {log.target_type || "-"}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {log.target_id ?? "-"}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-[520px] break-words">
                      {log.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentPage === 1 || isLoading}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
          >
            Previous
          </button>

          <div className="text-sm text-gray-600">
            Page <span className="font-semibold">{currentPage}</span>
          </div>

          <button
            onClick={goNext}
            disabled={!hasNextPage || isLoading}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
