import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

// ✅ Loading Spinner
const Spinner = () => (
  <div className="flex flex-col justify-center items-center h-screen bg-slate-50 gap-4">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
    <p className="text-slate-500 font-medium text-sm animate-pulse">
      Verifying Access...
    </p>
  </div>
);

// ✅ Helper: Get stored user safely (local + session)
const getStoredUser = () => {
  const userStr =
    localStorage.getItem("user_details") ||
    sessionStorage.getItem("user_details");

  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error("Invalid user_details in storage", e);
    return null;
  }
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ✅ 1) Loading state
  if (loading) {
    return <Spinner />;
  }

  // ✅ 2) Fallback user from storage (refresh safe)
  const currentUser = user || getStoredUser();

  // ✅ 3) Not logged in
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ 4) Normalize role
  const userRole = (
    currentUser.role?.name ||
    currentUser.role ||
    ""
  ).toLowerCase();

  // ✅ 5) Block public roles ALWAYS
  const publicRoles = ["student", "member", "user", "public"];
  if (publicRoles.includes(userRole)) {
    console.warn(`[Security] Public role blocked from admin: '${userRole}'`);
    return <Navigate to="/" replace />;
  }

  // ✅ 6) Normalize allowed roles list
  const normalizedAllowedRoles = allowedRoles.map((r) =>
    String(r).toLowerCase()
  );

  // ✅ 7) Admin panel access ONLY by allowedRoles
  const isAllowedByRole =
    normalizedAllowedRoles.length > 0
      ? normalizedAllowedRoles.includes(userRole)
      : false;

  if (isAllowedByRole) {
    return children;
  }

  // ❌ Not allowed role → blocked
  console.warn(`[Security] Blocked: Role='${userRole}'`);
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
