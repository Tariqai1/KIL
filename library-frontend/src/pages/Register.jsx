// src/pages/Register.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  IdentificationIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

import { authService } from "../api/authService";

const Register = () => {
  const navigate = useNavigate();

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirmPassword: "",
  });

  // --- UI STATE ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // --- Password Strength ---
  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return setPasswordStrength(0);
    if (pass.length > 5) score += 1;
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    setPasswordStrength(score);
  };

  const strengthLabel = useMemo(() => {
    if (passwordStrength <= 1) return "Very Weak";
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Good";
    if (passwordStrength <= 4) return "Strong";
    return "Very Strong";
  }, [passwordStrength]);

  const strengthColor = useMemo(() => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-emerald-500";
  }, [passwordStrength]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") calculateStrength(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const full_name = formData.full_name?.trim();
    const username = formData.username?.trim();
    const email = formData.email?.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!full_name || !username || !email || !password || !confirmPassword) {
      toast.error("Please fill all fields.");
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      triggerShake();
      return;
    }

    if (passwordStrength < 2) {
      toast.error("Password is too weak.");
      triggerShake();
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Creating your account...");

    try {
      await authService.register({
        username,
        email,
        full_name,
        password,
      });

      toast.success("Account created successfully!", { id: toastId });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        (Array.isArray(err?.response?.data) ? err?.response?.data?.[0]?.msg : null) ||
        "Registration failed.";

      toast.error(msg, { id: toastId });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#ECFEFF]">
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
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <UserPlusIcon className="w-6 h-6 text-white" />
            </div>

            <h2 className="mt-4 text-xl font-extrabold">Create Account</h2>
            <p className="text-white/80 text-xs mt-1">
              Join Markaz Library Portal
            </p>
          </div>

          {/* Body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase ml-1">
                  Full Name
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <IdentificationIcon className="w-5 h-5" />
                  </div>
                  <input
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none
                    focus:ring-2 focus:ring-[#2D89C8] focus:border-[#2D89C8] text-sm"
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </div>
              </div>

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
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none
                    focus:ring-2 focus:ring-[#2D89C8] focus:border-[#2D89C8] text-sm"
                    placeholder="Choose username"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase ml-1">
                  Email
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <EnvelopeIcon className="w-5 h-5" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none
                    focus:ring-2 focus:ring-[#2D89C8] focus:border-[#2D89C8] text-sm"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase ml-1">
                  Password
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>

                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none
                    focus:ring-2 focus:ring-[#2D89C8] focus:border-[#2D89C8] text-sm"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    disabled={loading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#2D89C8]"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Strength bar */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strengthColor} transition-all duration-300`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 text-right">
                      Strength: <span className="font-bold">{strengthLabel}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase ml-1">
                  Confirm Password
                </label>

                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>

                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none
                    focus:ring-2 focus:ring-[#2D89C8] focus:border-[#2D89C8] text-sm"
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    disabled={loading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#2D89C8]"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Match hint */}
                {formData.confirmPassword && (
                  <p
                    className={`text-[11px] mt-1 ${
                      formData.password === formData.confirmPassword
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {formData.password === formData.confirmPassword
                      ? "✅ Passwords match"
                      : "❌ Passwords do not match"}
                  </p>
                )}
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading}
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
                      Creating...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="normal"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      Create Account
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            {/* Login link */}
            <div className="mt-5 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="text-[#2D89C8] font-bold hover:underline">
                  Login
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

export default Register;
