import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserIcon,
  BookOpenIcon,
  ArchiveBoxIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { bookService } from "../api/bookService";

const Authors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // ✅ Safe author normalizer (Fix: null, spaces, object, case)
  const normalizeAuthor = (author) => {
    if (!author) return null;

    // If backend sends object like { name: "XYZ" }
    if (typeof author === "object") {
      author = author?.name || author?.title || "";
    }

    const clean = String(author).trim();
    if (!clean) return null;

    // normalize spaces
    return clean.replace(/\s+/g, " ");
  };

  useEffect(() => {
    fetchAuthors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAuthors = async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ Get all approved books
      const allBooks = await bookService.getAllBooks(true);
      const list = Array.isArray(allBooks) ? allBooks : allBooks?.books || [];

      // ✅ Count authors (works + volumes)
      const map = new Map();

      for (const book of list) {
        const authorName = normalizeAuthor(book?.author);
        if (!authorName) continue;

        // ignore unknown/bad
        if (authorName.toLowerCase() === "unknown" || authorName.length < 2) {
          continue;
        }

        // Case-insensitive grouping
        const key = authorName.toLowerCase();

        const prev = map.get(key);

        // volumes logic: total_copies else 1
        const copies = book?.total_copies ? parseInt(book.total_copies, 10) : 1;
        const safeCopies = Number.isNaN(copies) ? 1 : copies;

        if (!prev) {
          map.set(key, {
            name: authorName,
            works: 1,
            volumes: safeCopies,
          });
        } else {
          map.set(key, {
            ...prev,
            works: prev.works + 1,
            volumes: prev.volumes + safeCopies,
          });
        }
      }

      // Convert to array + sort A-Z
      const authorsList = Array.from(map.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setAuthors(authorsList);
    } catch (err) {
      console.error("❌ Error fetching authors:", err);
      setError("Failed to load authors. Please try again.");
      toast.error("Could not load authors.");
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Search filter
  const filteredAuthors = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return authors;

    return authors.filter((a) => a.name.toLowerCase().includes(query));
  }, [authors, q]);

  // ✅ Stats
  const totalWorks = useMemo(() => {
    return authors.reduce((sum, a) => sum + (a.works || 0), 0);
  }, [authors]);

  const totalVolumes = useMemo(() => {
    return authors.reduce((sum, a) => sum + (a.volumes || 0), 0);
  }, [authors]);

  // ✅ Navigate to Home with preSearch
  const handleAuthorClick = (authorName) => {
    navigate("/", {
      state: {
        preSearch: authorName,
        mode: "author", // optional future use
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
            Our Authors
          </h1>
          <p className="mt-4 text-white/80 text-sm md:text-base">
            Explore books by authors who shape knowledge and creativity.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-white/60 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search author name..."
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
            <div className="mt-3 text-xs text-white/70 flex flex-wrap justify-center gap-4">
              <span>
                Total Authors: <b className="text-white">{authors.length}</b>
              </span>
              <span>
                Total Works: <b className="text-white">{totalWorks}</b>
              </span>
              <span>
                Total Volumes: <b className="text-white">{totalVolumes}</b>
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
            <p className="mt-4 text-gray-500">Loading Authors...</p>
          </div>
        ) : filteredAuthors.length > 0 ? (
          <>
            {/* Result count */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <p className="text-sm text-gray-600">
                Showing <b className="text-gray-900">{filteredAuthors.length}</b>{" "}
                authors
                {q.trim() ? (
                  <>
                    {" "}
                    for <b className="text-[#2D89C8]">"{q.trim()}"</b>
                  </>
                ) : null}
              </p>

              <button
                onClick={fetchAuthors}
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:shadow-md transition"
              >
                Refresh
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAuthors.map((author, index) => (
                <motion.div
                  key={author.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.02 }}
                  onClick={() => handleAuthorClick(author.name)}
                  className="
                    group bg-white p-6 rounded-2xl
                    border border-gray-200
                    hover:shadow-xl hover:border-[#2D89C8]/40
                    transition-all duration-300 cursor-pointer
                    flex items-center justify-between
                  "
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
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
                      <UserIcon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-gray-800 text-lg group-hover:text-[#2D89C8] transition-colors line-clamp-1">
                        {author.name}
                      </h3>

                      <div className="mt-1 flex flex-col gap-1">
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <BookOpenIcon className="w-4 h-4" />
                          <span className="font-semibold">{author.works}</span>{" "}
                          Works
                        </p>

                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <ArchiveBoxIcon className="w-4 h-4" />
                          <span className="font-semibold">{author.volumes}</span>{" "}
                          Volumes
                        </p>
                      </div>
                    </div>
                  </div>

                  <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-[#2D89C8] group-hover:translate-x-1 transition-all" />
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-700 font-bold">
              {q.trim()
                ? "No authors found for your search."
                : "No authors found in the library database."}
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

export default Authors;
