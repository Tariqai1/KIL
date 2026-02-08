import React, { useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import useAuth from "../hooks/useAuth";
import { authService } from "../api/authService";
import api from "../api/axiosConfig";

import {
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const TOKEN_KEY = "token";
const USER_KEY = "user_details";

const Login = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [shake, setShake] = useState(false);

  const { login: setAuthData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDisabled = useMemo(() => loading || googleLoading, [loading, googleLoading]);

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const redirectAfterLogin = () => {
    const from = location.state?.from?.pathname;
    navigate(from || "/admin/dashboard", { replace: true });
  };

  const saveAuthToStorage = (token, user) => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("authToken");

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const username = credentials.username?.trim();
    const password = credentials.password?.trim();

    if (!username || !password) {
      toast.error("Please enter both username and password.");
      triggerShake();
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Logging you in...");

    try {
      const result = await authService.login(username, password);

      const token = result?.access_token;
      const user = result?.user;

      if (!token || !user) throw new Error("Token/User missing.");

      saveAuthToStorage(token, user);
      setAuthData({ ...result, token });

      toast.success(`Welcome, ${user?.full_name || user?.username || "User"}!`, {
        id: toastId,
      });

      redirectAfterLogin();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Login failed";
      toast.error(msg, { id: toastId });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    const toastId = toast.loading("Verifying Google...");

    try {
      const googleToken = credentialResponse?.credential;
      if (!googleToken) throw new Error("Google token missing");

      const res = await api.post("/api/auth/google", { token: googleToken });
      const result = res.data;

      const token = result?.access_token;
      const user = result?.user;

      if (!token || !user) throw new Error("Token/User missing");

      saveAuthToStorage(token, user);
      setAuthData({ ...result, token });

      toast.success("Google Sign-In Successful!", { id: toastId });
      redirectAfterLogin();
    } catch (err) {
      toast.error("Google Sign-In failed. Try again.", { id: toastId });
      triggerShake();
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#ECFEFF]">
      {/* Small Card */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        <motion.div
          animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-[#002147] to-[#003366] text-white relative">
            <div className="absolute top-4 right-4 opacity-20">
              <ShieldCheckIcon className="w-12 h-12" />
            </div>

            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <ArrowRightOnRectangleIcon className="w-6 h-6 text-white" />
            </div>

            <h2 className="mt-4 text-xl font-extrabold">Welcome Back</h2>
            <p className="text-white/80 text-xs mt-1">
              Login to continue to Library Portal
            </p>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Google */}
            <div className="mb-5 flex justify-center">
              <div className={`${googleLoading ? "opacity-50 pointer-events-none" : ""}`}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    toast.error("Google Login Failed");
                    triggerShake();
                  }}
                  theme="outline"
                  shape="pill"
                  width="260"
                  text="continue_with"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                OR
              </span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase ml-1">
                  Username
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    disabled={isDisabled}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none
                    focus:ring-2 focus:ring-[#2D89C8] focus:border-[#2D89C8] text-sm"
                    placeholder="Enter username"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-600 uppercase ml-1">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-[#2D89C8] font-bold hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>

                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    disabled={isDisabled}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none
                    focus:ring-2 focus:ring-[#2D89C8] focus:border-[#2D89C8] text-sm"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#2D89C8]"
                    disabled={isDisabled}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Button */}
              <motion.button
                whileHover={{ scale: isDisabled ? 1 : 1.01 }}
                whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                type="submit"
                disabled={isDisabled}
                className="w-full py-3 rounded-xl bg-[#002147] text-white font-extrabold text-sm
                hover:bg-[#003366] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Signing In...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="normal"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      Sign In
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            {/* Register */}
            <div className="mt-5 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="text-[#2D89C8] font-bold hover:underline">
                  Create
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          &copy; {new Date().getFullYear()} Library System
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
