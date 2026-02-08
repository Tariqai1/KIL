import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BuildingOfficeIcon,
  BookOpenIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { bookService } from "../api/bookService";

const Publishers = () => {
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // ✅ Safe publisher normalizer (Fix: null, spaces, object, case)
  const normalizePublisher = (publisher) => {
    if (!publisher) return null;

    // If backend sends object like { name: "XYZ" }
    if (typeof publisher === "object") {
      publisher = publisher?.name || publisher?.title || "";
    }

    const clean = String(publisher).trim();
    if (!clean) return null;

    // normalize spaces + keep original readable
    return clean.replace(/\s+/g, " ");
  };

  useEffect(() => {
    fetchPublishers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPublishers = async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ Get all approved books
      // (your code uses getAllBooks(true) - keeping same)
      const allBooks = await bookService.getAllBooks(true);

      const list = Array.isArray(allBooks) ? allBooks : allBooks?.books || [];

      // ✅ Count publishers
      const map = new Map();

      for (const book of list) {
        const pub = normalizePublisher(book?.publisher);
        if (!pub) continue;

        // Case-insensitive grouping
        const key = pub.toLowerCase();

        const prev = map.get(key);
        if (!prev) {
          map.set(key, { name: pub, count: 1 });
        } else {
          map.set(key, { ...prev, count: prev.count + 1 });
        }
      }

      // Convert to array + sort A-Z
      const publishersList = Array.from(map.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setPublishers(publishersList);
    } catch (err) {
      console.error("❌ Error fetching publishers:", err);
      setError("Failed to load publishers. Please try again.");
      toast.error("Could not load publishers.");
      setPublishers([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Search filter
  const filteredPublishers = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return publishers;

    return publishers.filter((p) => p.name.toLowerCase().includes(query));
  }, [publishers, q]);

  // ✅ Total books count
  const totalBooks = useMemo(() => {
    return publishers.reduce((sum, p) => sum + (p.count || 0), 0);
  }, [publishers]);

  // ✅ Navigate to PublicHome with preSearch (works with your PublicHome logic)
  const handlePublisherClick = (publisherName) => {
    navigate("/", {
      state: {
        preSearch: publisherName,
        mode: "publisher", // future-proof (optional)
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      {/* Header */}
      <div className="bg-[#002147] py-16 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-serif font-extrabold tracking-tight">
            Our Publishers
          </h1>
          <p className="mt-4 text-white/80 text-sm md:text-base">
            Browse books by the publishing houses that bring knowledge to you.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-white/60 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search publisher name..."
                className="
                  w-full pl-12 pr-4 py-3 rounded-xl
                  bg-white/10 border border-white/20
                  text-white placeholder-white/50
                  outline-none focus:ring-2 focus:ring-[#F4A261]
                  backdrop-blur-md
                "
              />
            </div>

            {/* Stats */}
            <div className="mt-3 text-xs text-white/70 flex justify-center gap-4">
              <span>
                Total Publishers:{" "}
                <b className="text-white">{publishers.length}</b>
              </span>
              <span>
                Total Books: <b className="text-white">{totalBooks}</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#002147] rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-500">Loading Publishers...</p>
          </div>
        ) : filteredPublishers.length > 0 ? (
          <>
            {/* Result count */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <b className="text-gray-900">{filteredPublishers.length}</b>{" "}
                publishers
                {q.trim() ? (
                  <>
                    {" "}
                    for <b className="text-[#2D89C8]">"{q.trim()}"</b>
                  </>
                ) : null}
              </p>

              <button
                onClick={fetchPublishers}
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:shadow-md transition"
              >
                Refresh
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPublishers.map((pub, index) => (
                <motion.div
                  key={pub.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.02 }}
                  onClick={() => handlePublisherClick(pub.name)}
                  className="
                    group bg-white p-6 rounded-2xl
                    border border-gray-200
                    hover:shadow-xl hover:border-[#2D89C8]/40
                    transition-all duration-300 cursor-pointer
                    flex items-center justify-between
                  "
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="
                        w-12 h-12
                        bg-orange-50 text-[#F4A261]
                        rounded-full flex items-center justify-center
                        group-hover:bg-[#F4A261] group-hover:text-white
                        transition-colors
                        shadow-sm
                      "
                    >
                      <BuildingOfficeIcon className="w-6 h-6" />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-gray-800 text-lg group-hover:text-[#2D89C8] transition-colors line-clamp-1">
                        {pub.name}
                      </h3>

                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <BookOpenIcon className="w-4 h-4" />
                        <span className="font-semibold">{pub.count}</span> Books
                      </p>
                    </div>
                  </div>

                  <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-[#2D89C8] group-hover:translate-x-1 transition-all" />
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <BuildingOfficeIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-700 font-bold">
              {q.trim()
                ? "No publishers found for your search."
                : "No publishers found in the library database."}
            </p>

            {q.trim() && (
              <button
                onClick={() => setQ("")}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#2D89C8] text-white font-bold hover:bg-[#2374ac] transition"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Publishers;
