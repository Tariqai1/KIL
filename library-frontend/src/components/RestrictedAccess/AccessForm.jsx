import React, { useState, useEffect } from "react";
import {
  User,
  Book,
  PenTool,
  Send,
  AlertCircle,
  Phone,
  Building2,
  GraduationCap,
  MapPin,
  Users,
  Hash,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

// ✅ If PURPOSES file missing, this fallback will work
import { PURPOSES as PURPOSES_FROM_FILE } from "./types";
const COUNTRY_CODES = [
  { code: "+91", name: "" },
  { code: "+92", name: "" },
  { code: "+1", name: "" },
  { code: "+44", name: "" },
  { code: "+971", name: "" },
  { code: "+966", name: "" },
  { code: "+880", name: "" },
  { code: "+90", name: "" },
  { code: "+98", name: "" },
  { code: "+93", name: "" },
];


const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const PURPOSES_FALLBACK = [
  "Academic Research",
  "Refutation / Critical Study",
  "Teaching / Lecture Preparation",
  "Thesis / Dissertation",
  "Personal Study (Supervised)",
];

const PURPOSES = Array.isArray(PURPOSES_FROM_FILE) && PURPOSES_FROM_FILE.length > 0
  ? PURPOSES_FROM_FILE
  : PURPOSES_FALLBACK;

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("authToken") ||
    ""
  );
};

const AccessForm = ({ book, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    fullName: "",
    whatsapp: "",
    countryCode: "+91",     // ✅ NEW
    whatsappNumber: "",     // ✅ NEW
    qualification: "",
    institution: "",
    isSalafi: false,
    purpose: [],
    previousWork: "",
    oathAccepted: false,

    // Optional Fields
    age: "",
    location: "",
    teachers: "",
  });

  // Auto-fill user data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setFormData((prev) => ({
          ...prev,
          fullName: parsed.full_name || parsed.username || prev.fullName,
        }));
      } catch (e) {
        console.error("User parse error", e);
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePurposeChange = (purpose) => {
    setFormData((prev) => ({
      ...prev,
      purpose: prev.purpose.includes(purpose)
        ? prev.purpose.filter((p) => p !== purpose)
        : [...prev.purpose, purpose],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!book?.id) {
      toast.error("Book ID missing. Please try again.");
      return;
    }

    if (!formData.oathAccepted) {
      toast.error("Please accept the declaration before submitting.");
      return;
    }

    if (formData.purpose.length === 0) {
      toast.error("Please select at least one purpose.");
      return;
    }

    if (!formData.fullName.trim()) {
      toast.error("Full Name is required.");
      return;
    }

    if (!formData.whatsappNumber.trim()) {
      toast.error("WhatsApp number is required.");
      return;
    }


    setLoading(true);
    const loadingToast = toast.loading("Submitting request...");

    try {
      const token = getToken();
      if (!token) {
        toast.error("Session expired. Please login again.", { id: loadingToast });
        setLoading(false);
        return;
      }

      // Payload
      const payload = {
        book_id: book.id,
        name: formData.fullName.trim(),
        whatsapp: `${formData.countryCode}${formData.whatsappNumber}`,

        qualification: formData.qualification.trim(),
        institution: formData.institution.trim(),
        is_salafi: formData.isSalafi,
        purpose: formData.purpose,
        previous_work: formData.previousWork.trim(),

        // Optional
        age: formData.age?.trim() || "N/A",
        location: formData.location?.trim() || "N/A",
        teachers: formData.teachers?.trim() || "N/A",
      };

      const response = await axios.post(
        `${API_URL}/api/restricted-requests/submit`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast.success("Request submitted successfully!", { id: loadingToast });
        onSuccess?.();
      } else {
        toast.error("Unexpected response from server.", { id: loadingToast });
      }
    } catch (error) {
      console.error("Submission Error:", error);

      let message = "Something went wrong. Please try again.";

      if (error.response) {
        const data = error.response.data;

        if (typeof data === "string") {
          message = data;
        } else if (typeof data?.detail === "string") {
          message = data.detail;
        } else if (Array.isArray(data?.detail)) {
          message = data.detail.join(", ");
        } else if (typeof data?.message === "string") {
          message = data.message;
        }

        if (error.response.status === 401) {
          message = "Session expired. Please login again.";
        }
      } else {
        message = "Network error. Please check your internet connection.";
      }

      toast.error(message, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] w-full max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="bg-emerald-900 p-6 text-white flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold">
            Restricted Access Request Form
          </h2>
          <p className="text-emerald-200 text-[11px] tracking-wide font-semibold mt-1">
            Request access for:{" "}
            <span className="text-white font-bold">{book?.title || "Book"}</span>
          </p>
        </div>
        <Book className="w-10 h-10 opacity-20" />
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 overflow-y-auto space-y-8 custom-scrollbar bg-slate-50/50">
        {/* Section 1 */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 border-b-2 border-emerald-100 pb-3 mb-6">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-black text-emerald-800">
              Section 1: Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Full Name
              </label>
              <input
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                WhatsApp Number
              </label>

              <div className="flex gap-2">
                {/* Country Code Dropdown */}
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-semibold"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                      {/* ({c.name}) */}
                    </option>
                  ))}
                </select>

                {/* Phone Number Input */}
                <input
                  required
                  name="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) => {
                    // ✅ Only digits allowed
                    const onlyDigits = e.target.value.replace(/\D/g, "");
                    setFormData((prev) => ({ ...prev, whatsappNumber: onlyDigits }));
                  }}
                  type="text"
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-mono"
                  placeholder="90000 00000"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Example: {formData.countryCode} {formData.whatsappNumber || "9000000000"}
              </p>
            </div>


            {/* Qualification */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                Qualification
              </label>
              <input
                required
                name="qualification"
                value={formData.qualification}
                onChange={handleInputChange}
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                placeholder="e.g. Graduate, Scholar, Teacher"
              />
            </div>

            {/* Institution */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Institution / University
              </label>
              <input
                required
                name="institution"
                value={formData.institution}
                onChange={handleInputChange}
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                placeholder="Enter your institution name"
              />
            </div>

            {/* Optional Age */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                Age (Optional)
              </label>
              <input
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                placeholder="e.g. 22"
              />
            </div>

            {/* Optional Location */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                Location (Optional)
              </label>
              <input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                placeholder="e.g. Mumbai, India"
              />
            </div>

            {/* Optional Teachers */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                Teachers / References (Optional)
              </label>
              <input
                name="teachers"
                value={formData.teachers}
                onChange={handleInputChange}
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                placeholder="e.g. Teacher name / reference"
              />
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 border-b-2 border-emerald-100 pb-3 mb-6">
            <AlertCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-black text-emerald-800">
              Section 2: Purpose of Request
            </h3>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-600">
              Select one or more purposes:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PURPOSES.map((p) => (
                <label
                  key={p}
                  className={`relative flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all hover:shadow-md ${formData.purpose.includes(p)
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm"
                    : "border-slate-200 bg-white hover:border-emerald-300"
                    }`}
                >
                  <span className="text-sm font-bold leading-6">{p}</span>
                  <input
                    type="checkbox"
                    checked={formData.purpose.includes(p)}
                    onChange={() => handlePurposeChange(p)}
                    className="w-5 h-5 accent-emerald-600"
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-200/60 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-amber-900">
            <PenTool className="w-5 h-5" />
            <h3 className="text-xl font-black">Section 3: Declaration</h3>
          </div>

          <div className="bg-white/60 p-6 rounded-2xl text-base leading-relaxed text-slate-800 text-justify border border-amber-200/50 backdrop-blur-sm">
            I confirm that I am requesting access for academic and supervised
            purposes only. I will not share this material with unauthorized
            individuals and will use it responsibly.
          </div>

          <label
            className={`flex items-center gap-4 cursor-pointer p-4 rounded-2xl shadow-lg transform active:scale-[0.98] transition-all border ${formData.oathAccepted
              ? "bg-emerald-800 text-white border-emerald-900"
              : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
              }`}
          >
            <input
              type="checkbox"
              required
              checked={formData.oathAccepted}
              onChange={handleInputChange}
              name="oathAccepted"
              className="w-6 h-6 accent-emerald-500"
            />
            <span className="font-bold select-none">
              I agree to the declaration above.
            </span>
          </label>
        </section>
      </div>

      {/* Footer */}
      <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-10">
        <button
          type="submit"
          disabled={!formData.oathAccepted || loading}
          className="flex-[2] bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:-translate-y-1"
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Request
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AccessForm;
