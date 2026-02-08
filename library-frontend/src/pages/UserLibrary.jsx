import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// --- Services + Hooks ---
import { bookService } from "../api/bookService";
import { useBookSearch } from "../hooks/useBookSearch";
import useAuth from "../hooks/useAuth";

// --- Components ---
// Removed external BookCard import since we define it internally now
import RestrictedAccessFlow from "../components/book/RestrictedAccessFlow";
import { getBookCover } from "../utils/cover"; // Kept for the Modal

// --- Icons (Outline - for UI) ---
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  FaceFrownIcon,
  XMarkIcon,
  BookOpenIcon, // Outline version for buttons
  LockClosedIcon as LockOutline, // Renamed to avoid conflict
  ChevronRightIcon,
  SparklesIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";

import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

// --- Icons (Solid - for PublicBookCard) ---
import {
  LockClosedIcon as LockSolid,
  EyeIcon as EyeSolid,
  CalendarIcon as CalendarSolid,
} from "@heroicons/react/24/solid";
import SuccessScreen from "../components/RestrictedAccess/SuccessScreen";

// --- Constants ---
const API_BASE_URL = "http://127.0.0.1:8000";
const FALLBACK_NO_COVER = "https://via.placeholder.com/400x600?text=No+Cover";
const FALLBACK_BROKEN = "https://via.placeholder.com/400x600?text=Image+Not+Found";

// ==========================================
// 1. PUBLIC BOOK CARD COMPONENT (Integrated)
// ==========================================
const PublicBookCard = ({
  book,
  onClick,
  isFavorite = false,
  onToggleFavorite,
  className = "", // Added to support external styling
}) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // --- Helpers ---
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

  const isRestricted = !!book?.is_restricted;

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

  // --- Image Resolver ---
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

  const [showSuccess, setShowSuccess] = useState(false);
  

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden ${className}`}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-20">
        {isRestricted ? (
          <div className="flex items-center gap-1 bg-red-600 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-md">
            <LockSolid className="w-4 h-4" />
            Restricted
          </div>
        ) : (
          <div className="bg-emerald-600 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-md">
            Open Access
          </div>
        )}
      </div>

      <div className="absolute top-3 right-3 z-20">
        <div className="bg-[#2D89C8] text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-md">
          #{bookId}
        </div>
      </div>

      {/* ❤️ Favorite */}
      {typeof onToggleFavorite === "function" && (
        <button
          onClick={(e) => onToggleFavorite(e, book?.id)}
          className="absolute bottom-3 right-3 z-20 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md border border-gray-200 bg-white hover:bg-gray-50 transition"
          title={isFavorite ? "Remove Favorite" : "Add Favorite"}
        >
          {isFavorite ? "❤️ Saved" : "🤍 Save"}
        </button>
      )}

      {/* COVER AREA */}
      <div className="relative px-4 pt-5 pb-3 flex justify-center bg-gradient-to-b from-[#F8F9FA] to-white group-hover:from-[#F1F3F5] transition-colors">
        <div className="relative w-[150px] sm:w-[165px] md:w-[175px] lg:w-[185px] aspect-[2/3] rounded-2xl overflow-hidden bg-gray-200 shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse" />
          )}

          {imgSrc && (
            <img
              src={imgSrc}
              alt={title}
              onError={handleImageError}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full transition-opacity duration-300 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ objectFit: "contain", background: "#e5e7eb" }}
              loading="lazy"
            />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold px-4 py-2 rounded-full bg-black/40">
              Click to View
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pb-4 flex flex-col flex-grow text-center">
        <h3
          className="text-sm md:text-base font-serif font-extrabold text-[#002147] leading-snug mb-1 line-clamp-2 group-hover:text-[#2D89C8] transition-colors"
          style={{
            fontFamily: '"Jameel Noori Nastaleeq", "Noto Naskh Arabic", serif',
          }}
        >
          {title}
        </h3>

        <p className="text-xs text-gray-500 mb-3 line-clamp-1">{author}</p>

        <div className="w-full h-px bg-gray-100 mt-auto mb-3" />

        {/* Meta */}
        <div className="flex justify-between items-center text-[11px] text-gray-500 font-semibold">
          <div className="flex items-center gap-1">
            <CalendarSolid className="w-4 h-4 text-gray-300" />
            <span>{metaDate}</span>
          </div>

          <div className="flex items-center gap-1">
            <EyeSolid className="w-4 h-4 text-gray-300" />
            <span>{views}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. MAIN USER LIBRARY COMPONENT
// ==========================================
const UserLibrary = () => {
  const navigate = useNavigate();
  const { user, isAuth } = useAuth();

  // --- STATE ---
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState("newest");

  const [showSuccess, setShowSuccess] = useState(false);

  // View Mode
  const [viewMode, setViewMode] = useState("grid");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // --- MODAL & FLOW ---
  const [selectedBook, setSelectedBook] = useState(null);

  // Restricted flow
  const [restrictedBook, setRestrictedBook] = useState(null);
  const [isAccessFlowOpen, setIsAccessFlowOpen] = useState(false);

  // --- FAVORITES ---
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("bookNest_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // --- CATEGORIES ---
  const categories = useMemo(
    () => [
      { value: "all", label: "All Categories" },
      { value: "aqeedah_fiqh", label: "Aqeedah & Fiqh" },
      { value: "quran_sciences", label: "Quran & Sciences" },
      { value: "history_seerah", label: "History & Seerah" },
      { value: "literature", label: "Literature & Adab" },
      { value: "science_tech", label: "Science & Tech" },
      { value: "islamic_studies", label: "General Islamic Studies" },
    ],
    []
  );

  // --- SEARCH HOOK ---
  const {
    searchTerm,
    setSearchTerm,
    selectedLanguage,
    setSelectedLanguage,
    selectedCategory,
    setSelectedCategory,
    filteredBooks,
  } = useBookSearch(books);

  // --- EFFECTS ---
  useEffect(() => {
    fetchBooks();

    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await bookService.getAllBooks(0, 300);
      setBooks(Array.isArray(data) ? data : data?.books || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load library.");
    } finally {
      setLoading(false);
    }
  };

  // --- HELPERS ---
  const safeText = (v, f = "") => {
    if (!v) return f;
    if (typeof v === "object") return v?.name || v?.title || v?.slug || f;
    return String(v);
  };

  const getCategoryKey = (book) => {
    if (typeof book?.category === "string" && book.category.trim())
      return book.category.trim().toLowerCase();

    if (typeof book?.category === "object" && book.category) {
      return String(book.category.slug || book.category.name || "general")
        .trim()
        .toLowerCase();
    }

    return "general";
  };

  const toggleFavorite = (e, bookId) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId];

      try {
        localStorage.setItem("bookNest_favorites", JSON.stringify(updated));
      } catch {}

      return updated;
    });
  };

  // Request Access handler
  const handleRequestAccess = (book) => {
    setSelectedBook(null); // close quick view

    if (!isAuth) {
      toast.error("Please login to request access.");
      navigate("/login");
      return;
    }

    setRestrictedBook(book);
    setIsAccessFlowOpen(true);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // --- SORTING ---
  const finalDisplayBooks = useMemo(() => {
    const sorted = [...(Array.isArray(filteredBooks) ? filteredBooks : [])];
    const safeDate = (b) => new Date(b?.created_at || 0).getTime();

    if (sortBy === "newest") sorted.sort((a, b) => safeDate(b) - safeDate(a));
    if (sortBy === "oldest") sorted.sort((a, b) => safeDate(a) - safeDate(b));
    if (sortBy === "az")
      sorted.sort((a, b) => (a?.title || "").localeCompare(b?.title || ""));
    if (sortBy === "favorites")
      return sorted.filter((b) => favorites.includes(b.id));

    return sorted;
  }, [filteredBooks, sortBy, favorites]);

  // --- GROUPING ---
  const groupedByCategory = useMemo(() => {
    const groups = {};
    finalDisplayBooks.forEach((b) => {
      const key = getCategoryKey(b);
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });
    return groups;
  }, [finalDisplayBooks]);

  const orderedCategoryKeys = useMemo(() => {
    const keys = categories
      .filter((c) => c.value !== "all")
      .map((c) => c.value.toLowerCase());

    const extra = Object.keys(groupedByCategory).filter(
      (k) => !keys.includes(k)
    );
    return [...keys, ...extra];
  }, [categories, groupedByCategory]);

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans text-slate-800 pb-24 relative">
      {/* HERO SECTION */}
      <div className="relative bg-[#0F172A] pt-12 pb-32 px-4 rounded-b-[2.5rem] shadow-xl overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
              <SparklesIcon className="w-4 h-4" /> Digital Library
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Discover Islamic{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Knowledge
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-2xl mx-auto mt-8"
          >
            <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
              <MagnifyingGlassIcon className="absolute left-5 h-6 w-6 text-slate-400" />
              <input
                type="text"
                placeholder="Search books, authors, or topics..."
                className="w-full pl-14 pr-12 py-4 bg-transparent text-white placeholder-slate-400/80 text-lg font-medium focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 p-1 text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="sticky top-20 z-40 max-w-7xl mx-auto px-4 -mt-16">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-lg rounded-2xl p-4 flex flex-col xl:flex-row gap-4 justify-between items-center"
        >
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-center md:justify-start">
            <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm font-bold bg-slate-100/50 px-3 py-2 rounded-lg">
              <FunnelIcon className="h-4 w-4" /> Filters
            </div>

            <select
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold hover:border-emerald-500 outline-none cursor-pointer"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="all">🌍 All Languages</option>
              <option value="english">English</option>
              <option value="urdu">Urdu</option>
              <option value="arabic">Arabic</option>
            </select>

            <select
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold hover:border-emerald-500 outline-none cursor-pointer max-w-[220px]"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 border-t xl:border-t-0 border-slate-200 pt-3 xl:pt-0 w-full xl:w-auto justify-between xl:justify-end">
            {/* View Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-white shadow text-emerald-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Grid view"
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>

              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-white shadow text-emerald-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="List view"
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowsUpDownIcon className="h-4 w-4 text-slate-400" />
              <select
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">Title (A-Z)</option>
                <option value="favorites">My Favorites</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 mt-12 space-y-12">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] bg-slate-200 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : finalDisplayBooks.length > 0 ? (
          orderedCategoryKeys.map((catKey) => {
            const list = groupedByCategory[catKey] || [];
            if (!list.length) return null;

            const preview = list.slice(0, 12);
            const catLabel =
              categories.find((c) => c.value.toLowerCase() === catKey)?.label ||
              catKey.replace(/_/g, " ").toUpperCase();

            return (
              <section key={catKey} className="relative">
                <div className="flex items-end justify-between mb-6 px-1">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                      {catLabel}
                    </h2>
                    <div className="h-1 w-12 bg-emerald-500 rounded-full mt-2" />
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCategory(catKey);
                      scrollToTop();
                    }}
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                  >
                    View All <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* GRID / LIST */}
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                      : "grid grid-cols-1 md:grid-cols-2 gap-4"
                  }
                >
                  <AnimatePresence>
                    {preview.map((book) => (
                      <motion.div
                        key={book.id}
                        layout
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className={`group relative ${
                          viewMode === "list"
                            ? "flex bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
                            : ""
                        }`}
                      >
                        <div
                          className={`relative cursor-pointer w-full ${
                            viewMode === "list"
                              ? "flex gap-4"
                              : "transition-transform duration-300 group-hover:-translate-y-2"
                          }`}
                          onClick={() => setSelectedBook(book)}
                        >
                          {/* Image / Card Area */}
                          <div
                            className={viewMode === "list" ? "w-24 shrink-0" : ""}
                          >
                            {/* ✅ USING PUBLIC BOOK CARD HERE */}
                            <PublicBookCard
                              book={book}
                              onClick={() => setSelectedBook(book)}
                              isFavorite={favorites.includes(book.id)}
                              onToggleFavorite={toggleFavorite}
                              className={viewMode === "list" ? "h-36" : ""} // Adjust height if list view
                            />
                          </div>

                          {/* List View Details (Only visible in list mode) */}
                          {viewMode === "list" && (
                            <div className="flex-1 flex flex-col justify-center py-1">
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full mb-1">
                                  {safeText(book.category, "General")}
                                </span>
                                {book.is_restricted && (
                                  <LockOutline className="w-4 h-4 text-red-500" />
                                )}
                              </div>

                              <h3 className="font-bold text-slate-800 leading-tight mb-1 line-clamp-2">
                                {book.title}
                              </h3>

                              <p className="text-xs text-slate-500 mb-2">
                                By {safeText(book.author, "Unknown")}
                              </p>

                              <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                                {book.description || "No description"}
                              </p>

                              <div className="mt-auto flex gap-2">
                                <button
                                  className="text-xs font-bold text-blue-600 hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (book.is_restricted) {
                                      handleRequestAccess(book);
                                    } else if (book.pdf_url) {
                                      window.open(book.pdf_url, "_blank");
                                    } else {
                                      toast.error("PDF not available");
                                    }
                                  }}
                                >
                                  {book.is_restricted ? "Request Access" : "Read Now"}
                                </button>

                                <span className="text-slate-300">•</span>

                                <button
                                  className="text-xs font-bold text-slate-500 hover:text-red-500"
                                  onClick={(e) => toggleFavorite(e, book.id)}
                                >
                                  {favorites.includes(book.id) ? "Saved" : "Save"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </section>
            );
          })
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
            <FaceFrownIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-slate-800">No books found</h3>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="mt-6 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Scroll top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-4 bg-[#002147] text-white rounded-full shadow-2xl hover:bg-blue-900 transition-colors border-2 border-white/20"
            title="Scroll to top"
          >
            <ArrowUpIcon className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* QUICK VIEW MODAL */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedBook(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full md:w-5/12 bg-slate-50 flex items-center justify-center p-8">
                <img
                  src={getBookCover(selectedBook)}
                  alt={selectedBook.title}
                  className="w-40 shadow-2xl rounded-lg"
                />
              </div>

              <div className="w-full md:w-7/12 p-8 flex flex-col overflow-y-auto">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded">
                    {safeText(selectedBook.category, "General")}
                  </span>
                  <button onClick={() => setSelectedBook(null)}>
                    <XMarkIcon className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <h2 className="text-3xl font-serif font-bold mt-4 mb-2 text-slate-900">
                  {selectedBook.title}
                </h2>

                <p className="text-slate-500 text-sm mb-6">
                  By {safeText(selectedBook.author, "Unknown")}
                </p>

                <p className="text-slate-600 text-sm mb-8 flex-grow">
                  {selectedBook.description || "No description."}
                </p>

                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-auto">
                  {selectedBook.is_restricted ? (
                    <button
                      onClick={() => handleRequestAccess(selectedBook)}
                      className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold flex justify-center gap-2"
                    >
                      <LockOutline className="w-5" /> Request Access
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (selectedBook.pdf_url)
                          window.open(selectedBook.pdf_url, "_blank");
                        else toast.error("PDF not available");
                      }}
                      className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold flex justify-center gap-2"
                    >
                      <BookOpenIcon className="w-5" /> Read Now
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

     {isAccessFlowOpen && (
        <RestrictedAccessFlow
          isOpen={isAccessFlowOpen}
          book={restrictedBook}
          onClose={() => setIsAccessFlowOpen(false)}
          onSuccess={() => setShowSuccess(true)}
        />
      )}

      {showSuccess && (
        <SuccessScreen
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
};

export default UserLibrary;