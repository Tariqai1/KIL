// src/utils/cover.js

// 1. Fallback Image
export const FALLBACK_COVER = "https://via.placeholder.com/300x450?text=No+Cover";

// 2. Base URL (Safe check)
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, ""); // End ka slash hata diya taaki double slash na bane

/**
 * [INTERNAL HELPER]
 * Ye function path ko clean karta hai aur full URL banata hai.
 * Ise hum Image aur PDF dono ke liye use karenge.
 */
const buildUrl = (path) => {
  if (!path) return null;

  // Agar already full URL hai
  if (path.startsWith("http")) return path;

  // Windows Path Fix (\ -> /)
  let cleanPath = path.replace(/\\/g, "/");

  // Leading Slash Fix (/uploads -> uploads)
  if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);

  // Static Prefix Logic
  // Backend 'uploads/img.png' bhejta hai, hum 'static/uploads/img.png' banayenge
  if (!cleanPath.startsWith("static/")) {
    cleanPath = `static/${cleanPath}`;
  }

  // Final URL Construction
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * [FOR IMAGES]
 * Ye function Book Cover ka URL deta hai.
 * Agar URL nahi milta to ye "Placeholder Image" return karta hai.
 */
export const getCoverUrl = (coverPath) => {
  const url = buildUrl(coverPath);
  return url || FALLBACK_COVER;
};

/**
 * [FOR BOOK OBJECT]
 * Book object se cover nikalne ke liye smart function.
 */
export const getBookCover = (book) => {
  if (!book) return FALLBACK_COVER;
  return getCoverUrl(book.cover_image_url || book.cover_image);
};

/**
 * [FOR PDFS] - 🔥 NEW ADDITION
 * Ye function PDF ka URL deta hai.
 * Agar PDF nahi hai to ye 'null' return karega (Image nahi).
 * Isse aap 'Read Now' button ko hide/disable kar sakte hain.
 */
export const getPdfUrl = (pdfPath) => {
  return buildUrl(pdfPath);
};