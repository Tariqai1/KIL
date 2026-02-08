import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // ✅ useNavigate added
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  EnvelopeIcon, 
  ArrowLeftIcon, 
  PaperAirplaneIcon,
  CheckCircleIcon,
  KeyIcon 
} from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // ✅ Hook for navigation
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Sending verification code...");

    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      
      toast.success("Code sent successfully!", { id: toastId });
      setIsSubmitted(true); 
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "User not found or server error.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Function to go to Reset Password Page
  const handleProceedToOtp = () => {
    // We pass the email in 'state' so the next page can use it automatically
    navigate('/reset-password', { state: { email: email } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
      
      {/* Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 relative z-10"
      >
        <div className="p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-inner"
            >
              {isSubmitted ? (
                <CheckCircleIcon className="h-9 w-9 text-emerald-600" />
              ) : (
                <EnvelopeIcon className="h-8 w-8 text-emerald-600" />
              )}
            </motion.div>
            
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {isSubmitted ? "Email Sent!" : "Forgot Password?"}
            </h2>
            
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              {isSubmitted 
                ? <span>We sent a 6-digit code to <b className="text-slate-800">{email}</b>.<br/>Check your inbox or spam folder.</span>
                : "Enter your registered email and we'll send you a code to reset your password."}
            </p>
          </div>

          {/* Logic: Show Form OR Success Options */}
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <EnvelopeIcon className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-800 text-sm font-medium placeholder:text-slate-400"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl transition-all flex justify-center items-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Sending Link...
                  </span>
                ) : (
                  <>
                    <span>Send Reset Code</span>
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <div className="space-y-4">
              
              {/* ✅ Primary Action: Enter OTP */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProceedToOtp}
                className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex justify-center items-center gap-2"
              >
                <KeyIcon className="h-5 w-5 text-emerald-400" />
                <span>I have the code (Enter OTP)</span>
              </motion.button>

              {/* Secondary Action: Open Email */}
              <button
                onClick={() => window.open('https://gmail.com', '_blank')}
                className="w-full py-3.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100 hover:bg-emerald-100 transition-all flex justify-center items-center gap-2"
              >
                <span>Open Gmail App</span>
              </button>

              {/* Tertiary Action: Resend/Edit */}
              <div className="flex justify-between items-center pt-2 px-1">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
                >
                  Change Email
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                >
                  Resend Code
                </button>
              </div>
            </div>
          )}

          {/* Back to Login Footer */}
          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-bold transition-colors group">
              <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Secure Login
            </Link>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;