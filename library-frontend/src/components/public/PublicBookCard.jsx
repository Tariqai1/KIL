// src/components/public/PublicBookCard.jsx
// ye line kabhi remove na karen this page is user for latest books k neche showing  book card cards
import React, { useEffect, useMemo, useState } from "react";
import {
  LockClosedIcon,
  LockOpenIcon, // ✅ New Icon for Unlocked State
  EyeIcon,
  CalendarIcon,
} from "@heroicons/react/24/solid";

const API_BASE_URL = "http://127.0.0.1:8000";

const FALLBACK_NO_COVER = "https://via.placeholder.com/400x600?text=No+Cover";
const FALLBACK_BROKEN = "https://via.placeholder.com/400x600?text=Image+Not+Found";

const PublicBookCard = ({
  book,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}) => {

  if (book?.is_restricted && !book?.user_has_access) {
    return null;
  }


  const [imgSrc, setImgSrc] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // -----------------------------
  // Helpers
  // -----------------------------
  const safeText = (value, fallback = "Unknown") => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "object") return value?.name || value?.title || fallback;
    const str = String(value).trim();
    return str.length ? str : fallback;
  };

  const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const title = useMemo(() => safeText(book?.title, "Untitled Book"), [book]);
  const author = useMemo(() => safeText(book?.author, "Unknown Author"), [book]);
  const bookId = useMemo(
    () => safeText(book?.id || book?.book_number, "000"),
    [book]
  );

  // ✅ ACCESS LOGIC (Updated)
  const isRestricted = !!book?.is_restricted;
  // Backend se jo naya flag aa raha hai usse use karein
  const userHasAccess = !!book?.user_has_access;

  // ✅ Views FIX
  const views = useMemo(() => {
    return safeNumber(
      book?.views ??
      book?.view_count ??
      book?.total_views ??
      book?.total_view ??
      book?.hits ??
      0,
      0
    );
  }, [book]);

  const metaDate = useMemo(
    () => formatDate(book?.created_at || book?.published_date),
    [book]
  );

  // -----------------------------
  // Image Resolver
  // -----------------------------
  useEffect(() => {
    setImgLoaded(false);

    if (!book) {
      setImgSrc(FALLBACK_NO_COVER);
      return;
    }

    const rawUrl = book.cover_image_url || book.cover_image;

    if (!rawUrl) {
      setImgSrc(FALLBACK_NO_COVER);
      return;
    }

    if (typeof rawUrl === "string" && rawUrl.startsWith("http")) {
      setImgSrc(rawUrl);
      return;
    }

    const path = String(rawUrl);
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    setImgSrc(`${API_BASE_URL}${cleanPath}`);
  }, [book]);

  const handleImageError = () => {
    setImgSrc(FALLBACK_BROKEN);
    setImgLoaded(true);
  };

  const handleCardClick = () => {
    if (typeof onClick === "function") onClick();
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden"
    >
      {/* ============================== */}
      {/* 🏷️ SMART BADGES AREA */}
      {/* ============================== */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">

        {isRestricted ? (
          userHasAccess ? (
            // CASE 1: Restricted BUT Approved (Unlocked) 🔵
            <div className="flex items-center gap-1 bg-indigo-600 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-md animate-pulse border border-white/20">
              <LockOpenIcon className="w-3.5 h-3.5" />
              Unlocked
            </div>
          ) : (
            // CASE 2: Restricted AND No Access (Locked) 🔴
            <div className="flex items-center gap-1 bg-red-600 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-md border border-white/20">
              <LockClosedIcon className="w-3.5 h-3.5" />
              Restricted
            </div>
          )
        ) : (
          // CASE 3: Public Book (Open) 🟢
          <div className="bg-emerald-600 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-md border border-white/20">
            Open Access
          </div>
        )}
      </div>

      {/* ID Badge */}
      <div className="absolute top-3 right-3 z-20">
        <div className="bg-[#2D89C8] text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-md border border-white/20">
          #{bookId}
        </div>
      </div>

      {/* ❤️ Favorite Button */}
      {typeof onToggleFavorite === "function" && (
        <button
          onClick={(e) => onToggleFavorite(e, book?.id)}
          className="absolute bottom-3 right-3 z-20 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md border border-gray-200 bg-white/90 backdrop-blur-sm hover:bg-white hover:scale-105 transition-all duration-200 text-gray-700"
          title={isFavorite ? "Remove Favorite" : "Add Favorite"}
        >
          {isFavorite ? "❤️ Saved" : "🤍 Save"}
        </button>
      )}

      {/* ============================== */}
      {/* 🖼️ COVER IMAGE AREA */}
      {/* ============================== */}
      <div className="relative px-4 pt-5 pb-3 flex justify-center bg-gradient-to-b from-[#F8F9FA] to-white group-hover:from-[#F1F3F5] transition-colors">
        {/* Book Cover Container */}
        <div className="relative w-[150px] sm:w-[165px] md:w-[175px] lg:w-[185px] aspect-[2/3] rounded-2xl overflow-hidden bg-gray-200 shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">

          {/* Loading Skeleton */}
          {!imgLoaded && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse" />
          )}

          {/* Actual Image */}
          {imgSrc && (
            <img
              src={imgSrc}
              alt={title}
              onError={handleImageError}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"
                }`}
              style={{ objectFit: "contain", background: "#e5e7eb" }}
              loading="lazy"
            />
          )}

          {/* ✨ Dynamic Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
            <span className={`opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md shadow-lg transform scale-90 group-hover:scale-100 duration-200 ${isRestricted && !userHasAccess ? "bg-red-600/80" : "bg-black/60"
              }`}>
              {/* Agar Restricted hai aur Access nahi hai to 'Request Access' dikhao */}
              {isRestricted && !userHasAccess ? "Request Access 🔒" : "Click to View 👀"}
            </span>
          </div>
        </div>
      </div>

      {/* ============================== */}
      {/* 📝 DETAILS AREA */}
      {/* ============================== */}
      <div className="px-4 pb-4 flex flex-col flex-grow text-center">
        {/* Title (Urdu Font Support) */}
        <h3
          className="text-sm md:text-base font-serif font-extrabold text-[#002147] leading-snug mb-1 line-clamp-2 group-hover:text-[#2D89C8] transition-colors"
        // style={{
        //   fontFamily: '"Jameel Noori Nastaleeq", "Noto Naskh Arabic", serif',
        //   lineHeight: "1.6" // Better spacing for Urdu
        // }}
        >
          {title}
        </h3>

        {/* Author */}
        <p className="text-xs text-gray-500 mb-3 line-clamp-1 font-medium">{author}</p>

        {/* Separator Line */}
        <div className="w-full h-px bg-gray-100 mt-auto mb-3 group-hover:bg-gray-200 transition-colors" />

        {/* Meta Info (Date & Views) */}
        <div className="flex justify-between items-center text-[11px] text-gray-500 font-semibold px-1">
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-gray-100 transition">
            <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
            <span>{metaDate}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-gray-100 transition">
            <EyeIcon className="w-3.5 h-3.5 text-gray-400" />
            <span>{views}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBookCard;