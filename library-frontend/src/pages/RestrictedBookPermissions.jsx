// src/pages/RestrictedBookPermissions.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { bookService } from "../api/bookService";
import { userService } from "../api/userService";

// ✅ FIX: default import
import restrictedBookService from "../api/restrictedBookService";

import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import {
  ShieldCheckIcon,
  UserIcon,
  UserGroupIcon,
  TrashIcon,
  PlusIcon,
  LockClosedIcon,
} from "@heroicons/react/20/solid";

import "../assets/css/ManagementPages.css";

// --- Helper Components ---
const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// ✅ Better error extractor
const extractError = (err, fallback = "Something went wrong") => {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.detail ||
    err?.message ||
    fallback
  );
};

// ✅ Safe number parser
const toInt = (v) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};

const RestrictedBookPermissions = () => {
  // --- State ---
  const [data, setData] = useState({ books: [], users: [], roles: [] });
  const [permissions, setPermissions] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("");

  // UI States
  const [loading, setLoading] = useState({
    init: true,
    perms: false,
    action: false,
  });

  const [feedback, setFeedback] = useState({ error: null, success: null });

  // Form State
  const [form, setForm] = useState({
    type: "user",
    userId: "",
    roleId: "",
  });

  // --- Derived Data ---
  const restrictedBooks = useMemo(
    () => (data.books || []).filter((b) => b?.is_restricted),
    [data.books]
  );

  // --- Data Fetching ---
  const fetchInitialData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, init: true }));
    setFeedback({ error: null, success: null });

    try {
      const [books, users, roles] = await Promise.all([
        bookService.getAllBooks(false),
        userService.getAllUsers(),
        userService.getAllRoles(),
      ]);

      setData({
        books: Array.isArray(books) ? books : [],
        users: Array.isArray(users) ? users : [],
        roles: Array.isArray(roles) ? roles : [],
      });
    } catch (err) {
      setFeedback({
        error: extractError(err, "Failed to load system data."),
        success: null,
      });
    } finally {
      setLoading((prev) => ({ ...prev, init: false }));
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- Load Permissions when book changes ---
  const loadPermissions = useCallback(async (bookId) => {
    if (!bookId) {
      setPermissions([]);
      return;
    }

    setLoading((prev) => ({ ...prev, perms: true }));
    setFeedback((prev) => ({ ...prev, error: null }));

    try {
      const res = await restrictedBookService.getPermissionsForBook(bookId);
      setPermissions(Array.isArray(res) ? res : []);
    } catch (err) {
      setPermissions([]);
      setFeedback({
        error: extractError(err, "Failed to load permissions."),
        success: null,
      });
    } finally {
      setLoading((prev) => ({ ...prev, perms: false }));
    }
  }, []);

  useEffect(() => {
    const bookId = toInt(selectedBookId);
    if (!bookId) {
      setPermissions([]);
      return;
    }
    loadPermissions(bookId);
  }, [selectedBookId, loadPermissions]);

  // Auto-dismiss success message
  useEffect(() => {
    if (feedback.success) {
      const timer = setTimeout(
        () => setFeedback((prev) => ({ ...prev, success: null })),
        2500
      );
      return () => clearTimeout(timer);
    }
  }, [feedback.success]);

  // --- Actions ---
  const handleAssign = async (e) => {
    e.preventDefault();
    setFeedback({ error: null, success: null });

    const bookId = toInt(selectedBookId);
    if (!bookId) {
      return setFeedback({ error: "Please select a book first.", success: null });
    }

    const userId = form.type === "user" ? toInt(form.userId) : null;
    const roleId = form.type === "role" ? toInt(form.roleId) : null;

    if (form.type === "user" && !userId) {
      return setFeedback({ error: "Please select a user.", success: null });
    }

    if (form.type === "role" && !roleId) {
      return setFeedback({ error: "Please select a role.", success: null });
    }

    setLoading((prev) => ({ ...prev, action: true }));

    try {
      const payload = {
        book_id: bookId,
        user_id: userId,
        role_id: roleId,
      };

      await restrictedBookService.assignPermission(payload);

      setFeedback({ error: null, success: "Access granted successfully!" });

      // Refresh permissions
      await loadPermissions(bookId);

      // Reset form values only
      setForm((prev) => ({ ...prev, userId: "", roleId: "" }));
    } catch (err) {
      setFeedback({
        error: extractError(err, "Assignment failed. It may already exist."),
        success: null,
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleRevoke = async (permissionId, name) => {
    if (!permissionId) return;

    if (!window.confirm(`Revoke access for ${name}?`)) return;

    setLoading((prev) => ({ ...prev, action: true }));
    setFeedback({ error: null, success: null });

    try {
      await restrictedBookService.revokePermission(permissionId);

      setFeedback({ error: null, success: "Access revoked." });

      setPermissions((prev) => prev.filter((p) => p.id !== permissionId));
    } catch (err) {
      setFeedback({
        error: extractError(err, "Failed to revoke access."),
        success: null,
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // --- Render Helpers ---
  const inputClass =
    "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all";
  const btnClass =
    "w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <SkeletonTheme baseColor="#f3f4f6" highlightColor="#ffffff">
      <div className="management-container p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-6">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
            <ShieldCheckIcon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Restricted Access Control
            </h2>
            <p className="text-sm text-slate-500">
              Manage granular permissions for sensitive content.
            </p>
          </div>
        </div>

        {/* Notifications */}
        {(feedback.error || feedback.success) && (
          <div
            className={`p-4 rounded-lg text-sm font-medium text-center ${
              feedback.error
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {feedback.error || feedback.success}
          </div>
        )}

        {/* Main Content */}
        {loading.init ? (
          <Skeleton count={5} height={50} />
        ) : (
          <div className="space-y-8">
            {/* 1. Book Selector */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Select Restricted Document
              </label>

              <div className="relative">
                <LockClosedIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  className={`${inputClass} pl-10`}
                  value={selectedBookId}
                  onChange={(e) => {
                    setSelectedBookId(e.target.value);
                    setFeedback({ error: null, success: null });
                  }}
                >
                  <option value="">-- Choose a Secure Book --</option>
                  {restrictedBooks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} (ID: {b.id})
                    </option>
                  ))}
                </select>
              </div>

              {restrictedBooks.length === 0 && (
                <p className="text-xs text-orange-500 mt-2">
                  No restricted books found in the library.
                </p>
              )}
            </div>

            {/* 2. Workspace */}
            {selectedBookId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Assign Form */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <PlusIcon className="h-5 w-5 text-indigo-600" /> Grant Access
                  </h3>

                  <form onSubmit={handleAssign} className="space-y-5">
                    {/* Toggle Type */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      {["user", "role"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              type,
                              userId: "",
                              roleId: "",
                            }))
                          }
                          className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
                            form.type === type
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {type === "user" ? (
                            <UserIcon className="h-4 w-4" />
                          ) : (
                            <UserGroupIcon className="h-4 w-4" />
                          )}
                          Assign to {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Dynamic Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                        Select {form.type}
                      </label>

                      <select
                        className={inputClass}
                        value={form.type === "user" ? form.userId : form.roleId}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            [form.type === "user" ? "userId" : "roleId"]:
                              e.target.value,
                          }))
                        }
                        disabled={loading.action}
                      >
                        <option value="">-- Select Target --</option>

                        {form.type === "user"
                          ? data.users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.username} ({u.full_name || "No Name"})
                              </option>
                            ))
                          : data.roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading.action}
                      className={`${btnClass} bg-indigo-600 hover:bg-indigo-700`}
                    >
                      {loading.action ? <Spinner /> : "Grant Permission"}
                    </button>
                  </form>
                </div>

                {/* Right: Permission List */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-emerald-600" /> Active
                    Permissions
                  </h3>

                  {loading.perms ? (
                    <Skeleton count={3} height={40} />
                  ) : permissions.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <LockClosedIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>No permissions assigned yet.</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {permissions.map((perm) => {
                        const isUser = !!perm.user_id;

                        const targetObj = isUser
                          ? data.users.find((u) => u.id === perm.user_id)
                          : data.roles.find((r) => r.id === perm.role_id);

                        const name = isUser
                          ? targetObj?.username || "Unknown User"
                          : targetObj?.name || "Unknown Role";

                        return (
                          <li
                            key={perm.id}
                            className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-indigo-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-full ${
                                  isUser
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-purple-100 text-purple-600"
                                }`}
                              >
                                {isUser ? (
                                  <UserIcon className="h-5 w-5" />
                                ) : (
                                  <UserGroupIcon className="h-5 w-5" />
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-bold text-slate-700">
                                  {name}
                                </p>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                                  {isUser ? "User Access" : "Role Access"}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRevoke(perm.id, name)}
                              disabled={loading.action}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Revoke Access"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SkeletonTheme>
  );
};

export default RestrictedBookPermissions;
