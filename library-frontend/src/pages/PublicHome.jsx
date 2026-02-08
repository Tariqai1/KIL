import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import {
  FaceFrownIcon,
  HeartIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";


// Components
import LibraryHero from "../components/public/LibraryHero";
import LibrarySearchStrip from "../components/public/LibrarySearchStrip";
import PublicBookCard from "../components/public/PublicBookCard";
import BookDetailsModal from "../components/book/BookDetailsModal";
import RestrictedAccessFlow from "../components/book/RestrictedAccessFlow";

// Services + Hooks
import { bookService } from "../api/bookService";
import { useBookSearch } from "../hooks/useBookSearch";
import LandingPostsPreview from "../components/public/LandingPostsPreview";
import DonationPanel from "../components/donation/DonationPanel";

// ✅ Skeleton Loader (Premium UI)
const BookCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
};

const PublicHome = () => {
  // --- 1) DATA STATE ---
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSuccess, setShowSuccess] = useState(false);

  // Filters
  const [sortBy, setSortBy] = useState("newest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Router location state (preSearch)
  const location = useLocation();

  // --- 2) MODAL STATE ---
  const [selectedBook, setSelectedBook] = useState(null);
  const [restrictedBook, setRestrictedBook] = useState(null);
  const [isAccessFlowOpen, setIsAccessFlowOpen] = useState(false);

  // --- 3) FAVORITES ---
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("bookNest_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Categories list
  const categories = useMemo(
    () => [
      { value: "all", label: "All Categories" },
      { value: "aqeedah_fiqh", label: "Aqeedah & Fiqh" },
      { value: "quran_sciences", label: "Quran & Sciences" },
      { value: "ahkam_masail", label: "Ahkam & Masail" },
      { value: "history_seerah", label: "History & Seerah" },
      { value: "literature", label: "Literature" },
      { value: "science_tech", label: "Science & Tech" },
    ],
    []
  );

  // --- 4) SEARCH HOOK ---
  const {
    searchTerm,
    setSearchTerm,
    selectedLanguage,
    setSelectedLanguage,
    selectedCategory,
    setSelectedCategory,
    filteredBooks,
  } = useBookSearch(books);

  // --- 5) FETCH BOOKS ---
  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookService.getAllBooks(0, 200);
      const list = Array.isArray(data) ? data : data?.books || [];
      setBooks(list);
    } catch (error) {
      console.error("❌ PublicHome Load Error:", error);
      toast.error("Could not load library catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // --- 6) AUTO-SEARCH EFFECT (from other pages) ---
  useEffect(() => {
    if (location.state?.preSearch) {
      setSearchTerm(location.state.preSearch);

      // Smooth scroll to grid
      setTimeout(() => {
        const el = document.getElementById("book-grid");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }, [location.state, setSearchTerm]);

  // --- 7) HANDLERS ---
  const toggleFavorite = (e, bookId) => {
    e.stopPropagation();

    setFavorites((prev) => {
      const exists = prev.includes(bookId);
      const newFavs = exists
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId];

      try {
        localStorage.setItem("bookNest_favorites", JSON.stringify(newFavs));
      } catch {
        // ignore storage errors
      }

      return newFavs;
    });
  };

  const handleRequestAccess = (book) => {
    setSelectedBook(null);
    setRestrictedBook(book);
    setIsAccessFlowOpen(true);
  };

  const handleClearAll = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedLanguage("all");
    setSortBy("newest");
    setShowFavoritesOnly(false);
  };

  // --- 8) SORTING (after filters) ---
  const sortedBooks = useMemo(() => {
    const list = Array.isArray(filteredBooks) ? [...filteredBooks] : [];

    const safeTitle = (b) => String(b?.title || b?.name || "").toLowerCase();

    if (sortBy === "az") {
      return list.sort((a, b) => safeTitle(a).localeCompare(safeTitle(b)));
    }

    if (sortBy === "oldest") {
      return list.sort((a, b) => {
        const da = new Date(a?.created_at || a?.upload_date || 0).getTime();
        const db = new Date(b?.created_at || b?.upload_date || 0).getTime();
        return da - db;
      });
    }

    // newest (default)
    return list.sort((a, b) => {
      const da = new Date(a?.created_at || a?.upload_date || 0).getTime();
      const db = new Date(b?.created_at || b?.upload_date || 0).getTime();
      return db - da;
    });
  }, [filteredBooks, sortBy]);

  // --- 9) FAVORITES FILTER (client side) ---
  const finalBooks = useMemo(() => {
    if (!showFavoritesOnly) return sortedBooks;
    return sortedBooks.filter((b) => favorites.includes(b.id));
  }, [sortedBooks, showFavoritesOnly, favorites]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-gray-800">
      <Toaster position="top-right" />

      {/* Hero */}
      <LibraryHero />

      {/* Search + Filters strip */}
      <LibrarySearchStrip
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        categories={categories}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8" id="book-grid">
        {/* Header + Stats */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#002147]">
              {searchTerm ? `Results for "${searchTerm}"` : "Latest Books"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Browse our extensive collection of Islamic literature.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Favorites Toggle */}
            <button
              onClick={() => setShowFavoritesOnly((p) => !p)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-all shadow-sm ${showFavoritesOnly
                ? "bg-pink-50 border-pink-200 text-pink-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              title="Show only favorite books"
            >
              <HeartIcon className="w-5 h-5" />
              Favorites
              {favorites.length > 0 && (
                <span className="ml-1 text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={loadBooks}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold shadow-sm disabled:opacity-50"
              title="Refresh Books"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            {/* Count */}
            <div className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-bold text-gray-700">{finalBooks.length}</span>{" "}
              books
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : finalBooks.length > 0 ? (
          // <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          //   {finalBooks.map((book) => (
          //     <PublicBookCard
          //       key={book.id}
          //       book={book}
          //       isFavorite={favorites.includes(book.id)}
          //       onToggleFavorite={(e) => toggleFavorite(e, book.id)}
          //       onClick={() => setSelectedBook(book)}
          //     />
          //   ))}
          // </div>


          <div className="mb-10">
            <h3 className="text-2xl font-serif font-bold text-[#002147] mb-4">
              Latest Arrivals
            </h3>

            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={20}
              loop={true}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              // navigation
              breakpoints={{
                392: { slidesPerView: 2 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
              }}
            >
              {sortedBooks.slice(0, 12).map((book) => (
                <SwiperSlide key={book.id}>
                  <PublicBookCard
                    book={book}
                    isFavorite={favorites.includes(book.id)}
                    onToggleFavorite={(e) => toggleFavorite(e, book.id)}
                    onClick={() => setSelectedBook(book)}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <FaceFrownIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-700 font-bold text-lg">
              No books found matching your criteria.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Try different keywords or clear filters.
            </p>

            <button
              onClick={handleClearAll}
              className="mt-5 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#2D89C8] text-white font-bold hover:bg-[#2374ac] transition-colors shadow-sm"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onRequestAccess={() => handleRequestAccess(selectedBook)}
        />
      )}

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

      <div className="max-w-7xl mx-auto px-4 py-16 border-t border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT: Posts */}
          <div className="lg:col-span-2">
            <LandingPostsPreview />
          </div>

          {/* RIGHT: Donation */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 h-fit">
            <DonationPanel />
          </div>

        </div>
      </div>


    </div>
  );
};

export default PublicHome;
