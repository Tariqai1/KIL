import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  KeyIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckBadgeIcon 
} from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ForgotPassword page se email yahan pass hogi
  const emailFromState = location.state?.email || "";

  const [formData, setFormData] = useState({
    email: emailFromState,
    otp: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Agar user direct is link par aa jaye bina email ke, to wapas bhej do
  useEffect(() => {
    if (!formData.email) {
      toast.error("Invalid session. Please try again.");
      navigate('/forgot-password');
    }
  }, [formData.email, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Verifying OTP & Updating Password...");

    try {
      // Backend Call
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email: formData.email,
        otp: formData.otp,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });

      toast.success("Password Reset Successfully!", { id: toastId });
      
      // Login page par bhej dein
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Invalid OTP or Server Error";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
      
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 relative z-10 p-8"
      >
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <KeyIcon className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Set New Password</h2>
          <p className="text-slate-500 text-sm mt-1">
            Enter the OTP sent to <span className="font-semibold text-slate-700">{formData.email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* OTP Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase ml-1">OTP Code</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <CheckBadgeIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                name="otp"
                maxLength={6}
                value={formData.otp}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-800 font-bold tracking-widest text-center text-lg"
                placeholder="0 0 0 0 0 0"
                required
              />
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase ml-1">New Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <LockClosedIcon className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="New secure password"
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase ml-1">Confirm Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <LockClosedIcon className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Retype password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-purple-600 cursor-pointer"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-purple-600 text-white font-bold text-sm shadow-lg shadow-purple-900/30 hover:bg-purple-700 transition-all flex justify-center items-center gap-2"
          >
            {loading ? "Verifying..." : "Update Password"}
          </button>
        </form>

      </motion.div>
    </div>
  );
};

export default ResetPassword;