import React, { useEffect, useState } from "react";
import {
  User,
  Book,
  PenTool,
  Send,
  Phone,
  Building2,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { bookService } from "../../api/bookService";

/* ===============================
   PURPOSE OPTIONS
================================ */
const PURPOSES = [
  "Academic Research / Thesis",
  "Refutation & Critical Analysis",
  "Teaching / Instruction",
  "Personal Critical Study",
  "Reference Verification",
];

const AccessRequestForm = ({ book, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    qualification: "",
    institution: "",
    purpose: [],
    oathAccepted: false,
  });

  /* ===============================
     AUTO-FILL USER (OPTIONAL)
  ================================ */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setFormData((prev) => ({
          ...prev,
          name: parsed.username || "",
        }));
      } catch (err) {
        console.error("User parse error", err);
      }
    }
  }, []);

  /* ===============================
     HANDLERS
  ================================ */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const togglePurpose = (purpose) => {
    setFormData((prev) => ({
      ...prev,
      purpose: prev.purpose.includes(purpose)
        ? prev.purpose.filter((p) => p !== purpose)
        : [...prev.purpose, purpose],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.oathAccepted) {
      toast.error("Please accept the declaration before submitting.");
      return;
    }

    if (formData.purpose.length === 0) {
      toast.error("Please select at least one purpose.");
      return;
    }

    setIsSubmitting(true);
    try {
      await bookService.sendBookRequest({
        book_id: book.id,
        name: formData.name,
        whatsapp: formData.whatsapp,
        qualification: formData.qualification,
        institution: formData.institution,
        purpose: formData.purpose,
        delivery_address: "Digital Access Request",
      });

      toast.success("Access request submitted successfully.");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
      {/* HEADER */}
      <div className="border-b p-6 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">
            Special Academic Access Request
          </h2>
          <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mt-1">
            Confidential Review Required
          </p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-xl border">
          <Book className="w-6 h-6 text-emerald-700" />
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/40">
        {/* PERSONAL INFO */}
        <section className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" /> Personal & Academic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="WhatsApp Number" name="whatsapp" value={formData.whatsapp} onChange={handleChange} required />
            <Input label="Academic Qualification" name="qualification" value={formData.qualification} onChange={handleChange} required />
            <Input label="Institution / Organization" name="institution" value={formData.institution} onChange={handleChange} required />
          </div>
        </section>

        {/* PURPOSE */}
        <section className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Purpose of Access
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PURPOSES.map((p) => (
              <label
                key={p}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition
                  ${
                    formData.purpose.includes(p)
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-emerald-300"
                  }`}
              >
                <span className="font-medium">{p}</span>
                <div className="w-5 h-5 rounded border flex items-center justify-center">
                  {formData.purpose.includes(p) && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={formData.purpose.includes(p)}
                  onChange={() => togglePurpose(p)}
                  className="hidden"
                />
              </label>
            ))}
          </div>
        </section>

        {/* DECLARATION */}
        <section className="bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm">
          <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
            <PenTool className="w-5 h-5" /> Declaration
          </h3>

          <p className="text-slate-700 leading-relaxed mb-4">
            I solemnly declare that the requested material will be used strictly
            for academic and scholarly purposes. I will not distribute, share,
            or misuse the content in any form.
          </p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="oathAccepted"
              checked={formData.oathAccepted}
              onChange={handleChange}
            />
            <span className="font-semibold">
              I agree to the above declaration.
            </span>
          </label>
        </section>
      </div>

      {/* FOOTER */}
      <div className="p-5 border-t bg-white flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : <><Send className="w-5 h-5" /> Submit Request</>}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 border border-slate-300 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

/* ===============================
   REUSABLE INPUT
================================ */
const Input = ({ label, ...props }) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-slate-700">{label}</label>
    <input
      {...props}
      className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
    />
  </div>
);

export default AccessRequestForm;
