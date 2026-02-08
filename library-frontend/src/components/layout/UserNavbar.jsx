import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// --- ICONS ---
import { HeartIcon } from "@heroicons/react/24/solid";
import {
  MegaphoneIcon,
  BookOpenIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ClockIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  TableCellsIcon,
  UsersIcon,
  BuildingOfficeIcon,
  HomeIcon,
  ChevronDownIcon,
  ArrowLeftOnRectangleIcon // Icon for Login
} from "@heroicons/react/24/outline";

// --- COMPONENTS & HOOKS ---
import useAuth from "../../hooks/useAuth";
import NotificationBell from "../common/NotificationBell";
import DonationModal from "../donation/DonationModal";

// ✅ CONFIG
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const MARKAZ_LOGO_URL = `${API_BASE_URL}/static/images/MarkazLogo.png`;

// ==========================================
// 1. SUB-COMPONENTS
// ==========================================

const TopLink = ({ label, icon: Icon, href = "#" }) => (
  <a
    href={href}
    className="flex items-center gap-1.5 text-[11px] font-medium text-blue-100/70 hover:text-white transition-colors duration-200"
  >
    {Icon && <Icon className="h-3.5 w-3.5" />}
    {label}
  </a>
);

const NavItem = ({ to, label, icon: Icon, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `
      relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300
      ${
        isActive
          ? "text-[#002147] bg-blue-50/80"
          : "text-slate-500 hover:text-[#002147] hover:bg-slate-50"
      }
    `}
  >
    {({ isActive }) => (
      <>
        {Icon && (
          <Icon
            className={`h-4 w-4 transition-colors ${
              isActive ? "text-[#002147]" : "text-slate-400"
            }`}
          />
        )}
        <span>{label}</span>
        {isActive && (
          <motion.div
            layoutId="active-nav-pill"
            className="absolute inset-0 rounded-xl bg-blue-50/50 -z-10 border border-blue-100/50"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </>
    )}
  </NavLink>
);

// ==========================================
// 2. MAIN NAVBAR COMPONENT
// ==========================================

const UserNavbar = () => {
  const { user, isAuth, logout } = useAuth();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const profileRef = useRef(null);

  const handleLogout = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-col w-full relative z-50 font-sans">
      
      {/* ----------------------------------------------------
          TOP BAR
      ---------------------------------------------------- */}
      <div className="bg-[#001D3D] border-b border-white/5 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <TopLink label="Our Projects" icon={GlobeAltIcon} />
            <TopLink label="About Us" icon={InformationCircleIcon} />
            <TopLink label="Database" icon={TableCellsIcon} />
          </div>
          <div className="text-white/20 text-[10px] font-bold tracking-[0.2em] uppercase">
            Markaz Ahle Hadees Kokan
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          MAIN NAVBAR
      ---------------------------------------------------- */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            
            {/* LOGO */}
            <div className="flex items-center min-w-[200px]">
              <Link to="/" className="flex items-center gap-3 group" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img
                    src={MARKAZ_LOGO_URL}
                    alt="Logo"
                    className="relative z-10 w-11 h-11 object-contain bg-white rounded-full border border-slate-100 shadow-sm group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-extrabold text-lg text-[#002147] tracking-tight">
                    Markaz Library
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    Ahle Hadees Kokan
                  </span>
                </div>
              </Link>
            </div>

            {/* DESKTOP NAV */}
            <div className="hidden md:flex items-center space-x-1">
              <NavItem to="/" label="Home" icon={HomeIcon} />
              <NavItem to="/books" label="Library" icon={BookOpenIcon} />
              <NavItem to="/authors" label="Authors" icon={UsersIcon} />
              <NavItem to="/publishers" label="Publishers" icon={BuildingOfficeIcon} />
              <NavItem to="/posts" label="Updates" icon={MegaphoneIcon} />
              {isAuth && (
                <>
                  <div className="h-4 w-px bg-slate-300 mx-2" />
                  <NavItem to="/history" label="History" icon={ClockIcon} />
                </>
              )}
            </div>

            {/* RIGHT ACTIONS */}
            <div className="hidden md:flex items-center justify-end gap-4 min-w-[200px]">
              
              {/* Donate */}
              <button
                onClick={() => setIsDonationOpen(true)}
                className="group flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-600 hover:text-white transition-all duration-300 border border-rose-100 hover:border-rose-600 shadow-sm"
              >
                <HeartIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Donate</span>
              </button>

              {/* Auth Logic */}
              {isAuth ? (
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                  <NotificationBell />

                  {/* Profile Dropdown */}
                  <div ref={profileRef} className="relative">
                    <button
                      onClick={() => setIsProfileOpen((p) => !p)}
                      className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                    >
                      <div className="flex flex-col items-end leading-none">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Hi,</span>
                        <span className="text-sm font-bold text-[#002147] max-w-[100px] truncate">
                          {user?.username || "User"}
                        </span>
                      </div>
                      <div className="h-9 w-9 rounded-full bg-[#002147] text-white flex items-center justify-center border-2 border-white shadow-md font-bold text-sm ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                        {user?.username?.[0]?.toUpperCase()}
                      </div>
                      <ChevronDownIcon className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden ring-1 ring-black/5"
                        >
                          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                             <p className="text-xs text-slate-500 font-semibold">Signed in as</p>
                             <p className="text-sm font-bold text-[#002147] truncate">{user?.username}</p>
                          </div>
                          <div className="p-1.5 space-y-1">
                            <Link
                              to="/profile"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                              <UserCircleIcon className="w-5 h-5 text-slate-400" />
                              My Profile
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 transition-colors text-left"
                            >
                              <ArrowRightOnRectangleIcon className="w-5 h-5" />
                              Log Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                  {/* ✅ ONLY LOGIN BUTTON (Register Removed) */}
                  <Link
                    to="/login"
                    className="flex items-center gap-2 bg-[#002147] text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-[#003366] hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                    Log in
                  </Link>
                </div>
              )}
            </div>

            {/* MOBILE TOGGLE */}
            <div className="flex items-center gap-3 md:hidden">
              {isAuth && <NotificationBell />}
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------
            MOBILE MENU
        ---------------------------------------------------- */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden shadow-2xl"
            >
              <div className="px-4 py-6 space-y-1">
                
                {/* User Info / Login Mobile */}
                <div className="mb-6 pb-6 border-b border-slate-100">
                    {isAuth ? (
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
                            <div className="h-10 w-10 rounded-full bg-[#002147] text-white flex items-center justify-center font-bold text-lg shadow-md">
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{user?.username}</p>
                                <p className="text-xs text-slate-500">Active Member</p>
                            </div>
                            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white text-blue-600 rounded-lg shadow-sm border border-slate-100">
                                <UserCircleIcon className="w-5 h-5" />
                            </Link>
                        </div>
                    ) : (
                        // ✅ ONLY LOGIN BUTTON MOBILE (Register Removed)
                        <Link
                            to="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-[#002147] text-white rounded-xl font-bold shadow-md active:scale-95 transition-transform"
                        >
                            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                            Log In to Portal
                        </Link>
                    )}
                </div>

                {/* Mobile Links */}
                <div className="space-y-1">
                  <NavItem to="/" label="Home" icon={HomeIcon} onClick={() => setIsMobileMenuOpen(false)} />
                  <NavItem to="/books" label="Library" icon={BookOpenIcon} onClick={() => setIsMobileMenuOpen(false)} />
                  <NavItem to="/authors" label="Authors" icon={UsersIcon} onClick={() => setIsMobileMenuOpen(false)} />
                  <NavItem to="/publishers" label="Publishers" icon={BuildingOfficeIcon} onClick={() => setIsMobileMenuOpen(false)} />
                  <NavItem to="/posts" label="Updates" icon={MegaphoneIcon} onClick={() => setIsMobileMenuOpen(false)} />
                  {isAuth && (
                      <NavItem to="/history" label="History" icon={ClockIcon} onClick={() => setIsMobileMenuOpen(false)} />
                  )}
                </div>

                {/* Mobile Actions */}
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                    <button
                        onClick={() => {
                            setIsDonationOpen(true);
                            setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm border border-rose-100"
                    >
                        <HeartIcon className="w-4 h-4" />
                        Donate
                    </button>
                    
                    {isAuth && (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-bold text-sm transition-colors"
                        >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            Log Out
                        </button>
                    )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* DONATION MODAL */}
      <DonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
      />
    </div>
  );
};

export default UserNavbar;