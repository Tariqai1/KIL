import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// ================= AUTH & COMMON =================
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Logout from "./pages/Logout";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/common/ProtectedRoute";

// ================= LAYOUTS =================
import Layout from "./components/layout/Layout";
import UserLayout from "./components/layout/UserLayout";

// ================= PUBLIC PAGES =================
import PublicHome from "./pages/PublicHome";
import ReadBook from "./pages/ReadBook";
import History from "./pages/History";
import MarkazFeed from "./components/public/MarkazFeed";
import LatestPosts from "./components/public/LatestPosts";

// ================= ADMIN (NON-LAZY) =================
import DonationManager from "./pages/Admin/DonationManager";
import CreatePost from "./pages/Admin/CreatePost";

// ================= LAZY PAGES =================
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BookManagement = lazy(() => import("./pages/BookManagement"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const RoleManagement = lazy(() => import("./pages/RoleManagement"));
const RolePermissionManagement = lazy(() => import("./pages/RolePermissionManagement"));
const ApprovalManagement = lazy(() => import("./pages/ApprovalManagement"));
const CopiesIssuing = lazy(() => import("./pages/CopiesIssuing"));
const LanguageManagement = lazy(() => import("./pages/LanguageManagement"));
const LocationManagement = lazy(() => import("./pages/LocationManagement"));
const CategoryManagement = lazy(() => import("./pages/CategoryManagement"));
const SubcategoryManagement = lazy(() => import("./pages/SubcategoryManagement"));
const RestrictedBookPermissions = lazy(() => import("./pages/RestrictedBookPermissions"));
const DigitalAccessHistory = lazy(() => import("./pages/DigitalAccessHistory"));
const AuditLogPage = lazy(() => import("./pages/AuditLogPage"));
const AccessRequests = lazy(() => import("./components/admin/AccessRequests"));
const BookDetail = lazy(() => import("./pages/Admin/BookDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const UserLibrary = lazy(() => import("./pages/UserLibrary"));
const Authors = lazy(() => import("./pages/Authors"));
const Publishers = lazy(() => import("./pages/Publishers"));

// ✅ TEST / URDU EDITOR
const UrduEditor = lazy(() => import("./components/UrduEditor/UrduEditor"));

// ================= CONFIG =================
const ADMIN_ALLOWED_ROLES = [
  "admin",
  "superadmin",
  "editor",
  "manager",
  "librarian",
  "staff",
];

// ================= HELPERS =================
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
};

const PageLoader = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-white">
    <div className="w-12 h-12 border-4 border-slate-200 border-t-[#002147] rounded-full animate-spin"></div>
    <p className="mt-4 text-sm font-bold text-slate-400 tracking-widest uppercase">
      Loading Library...
    </p>
  </div>
);

// ================= APP =================
function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" />

      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ================= PUBLIC / USER ROUTES ================= */}
          <Route path="/" element={<UserLayout />}>
            <Route index element={<PublicHome />} />
            <Route path="news" element={<MarkazFeed />} />
            <Route path="posts" element={<LatestPosts />} />
            <Route path="authors" element={<Authors />} />
            <Route path="publishers" element={<Publishers />} />
            <Route path="books" element={<UserLibrary />} />
            <Route path="books/:id" element={<BookDetail />} />
            <Route path="read/:id" element={<ReadBook />} />
            <Route path="history" element={<History />} />

            {/* ✅ FIXED: TEST EDITOR ROUTE */}
            <Route path="test-editor" element={<UrduEditor />} />

            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />

            <Route
              path="profile"
              element={
                <ProtectedRoute allowedRoles={ADMIN_ALLOWED_ROLES}>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="logout" element={<Logout />} />

          {/* ================= ADMIN ROUTES ================= */}
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ALLOWED_ROLES}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="donation" element={<DonationManager />} />
            <Route path="posts/add" element={<CreatePost />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="roles" element={<RoleManagement />} />
            <Route path="roles-permissions" element={<RolePermissionManagement />} />
            <Route path="books" element={<BookManagement />} />
            <Route path="books/:id" element={<BookDetail />} />
            <Route path="copies" element={<CopiesIssuing />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="subcategories" element={<SubcategoryManagement />} />
            <Route path="languages" element={<LanguageManagement />} />
            <Route path="locations" element={<LocationManagement />} />
            <Route path="approvals" element={<ApprovalManagement />} />
            <Route path="access-requests" element={<AccessRequests />} />
            <Route path="book-permissions" element={<RestrictedBookPermissions />} />
            <Route path="digital-access-history" element={<DigitalAccessHistory />} />
            <Route path="logs" element={<AuditLogPage />} />

            {/* (Optional) Admin-only editor */}
            <Route path="test-editor" element={<UrduEditor />} />
          </Route>

          {/* ================= 404 ================= */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Suspense>
    </>
  );
}

export default App;
