import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import useAuth from "./hooks/useAuth";

// --- Layouts ---
import Layout from "./components/layout/Layout";        // Admin Sidebar Layout
import UserLayout from "./components/layout/UserLayout"; // Public/User Navbar Layout

// --- Eager Loading (Critical Pages) ---
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// --- Lazy Loading (Admin Components) ---
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BookManagement = lazy(() => import("./pages/BookManagement"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
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
const BookDetail = lazy(() => import("./pages/Admin/BookDetail"));
// 🆕 Admin Access Requests (New Import)
const AccessRequests = lazy(() => import('./components/admin/AccessRequests'));

// --- Lazy Loading (User Components) ---
const UserLibrary = lazy(() => import("./components/user/UserLibrary"));
const Profile = lazy(() => import("./pages/Profile"));
const UrduEditor = lazy(() => import('./components/UrduEditor/UrduEditor'));

// --- Helper: Scroll To Top ---
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// --- Helper: Modern Loader ---
const PageLoader = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-white">
    <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
    <p className="mt-4 text-sm font-bold text-slate-400 tracking-widest uppercase">Loading...</p>
  </div>
);

// --- Protected Route Logic ---
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuth, role, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  // Agar user authenticated nahi hai
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Agar sirf Admin ke liye hai aur user Student hai
  if (adminOnly && role !== "Admin" && role !== "SuperAdmin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" reverseOrder={false} />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          
          {/* ==========================================
              1. PUBLIC ROUTES (Anyone can access)
             ========================================== */}
          <Route path="/" element={<UserLayout />}>
             {/* Default Home Page -> UserLibrary */}
            <Route index element={<UserLibrary />} />
            <Route path="books" element={<BookDetail />} />
            
            {/* Login & Register */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            
            {/* Private User Routes */}
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="/logout" element={<Logout />} />

          {/* ==========================================
              2. ADMIN ROUTES (Authenticated Admin Only)
             ========================================== */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Default Admin Page -> Dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="books" element={<BookManagement />} />
            <Route path="books/:id" element={<BookDetail />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="copies" element={<CopiesIssuing />} />
            <Route path="approvals" element={<ApprovalManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="subcategories" element={<SubcategoryManagement />} />
            <Route path="languages" element={<LanguageManagement />} />
            <Route path="locations" element={<LocationManagement />} />
            <Route path="roles" element={<RolePermissionManagement />} />
            <Route path="book-permissions" element={<RestrictedBookPermissions />} />
            <Route path="digital-access" element={<DigitalAccessHistory />} />
            <Route path="logs" element={<AuditLogPage />} />
            
            {/* 🆕 NEW ROUTE: Access Requests */}
            <Route path="access-requests" element={<AccessRequests />} />
            
          </Route>

          {/* ==========================================
              3. UTILITY ROUTES
             ========================================== */}
          <Route path="/test-editor" element={
             <div className="fixed inset-0 z-[9999] bg-gray-100">
               <UrduEditor initialTitle="Urdu Editor Test" />
             </div>
          } />

          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Suspense>
    </>
  );
}

export default App;