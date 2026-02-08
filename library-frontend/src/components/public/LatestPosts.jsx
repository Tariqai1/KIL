import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDaysIcon,
  DocumentTextIcon,
  XMarkIcon,
  ArrowLongRightIcon,
  MegaphoneIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import postService from "../../api/postService";

// ✅ Config: API Base URL
const API_BASE_URL = "http://127.0.0.1:8000";

const LatestPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  // For image error handling (card + modal)
  const [brokenImages, setBrokenImages] = useState({}); // { [postId]: true }

  useEffect(() => {
    fetchPosts();
  }, []);

  // ✅ ESC to close modal
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedPost(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await postService.getAllPosts();
      console.log("Fetched Posts Data:", data);

      // Safety: if not array
      const list = Array.isArray(data) ? data : data?.posts || [];
      setPosts(list);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Robust Image/File URL helper
  const getFileUrl = (path) => {
    if (!path) return null;

    // If it's already a full URL (cloudinary etc.)
    if (String(path).startsWith("http://") || String(path).startsWith("https://")) {
      return path;
    }

    // Ensure slash
    const cleanPath = String(path).startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  // ✅ Detect file type (image/pdf/unknown)
  const getFileType = (fileUrl) => {
    if (!fileUrl) return "none";
    const lower = fileUrl.toLowerCase();

    if (lower.endsWith(".pdf")) return "pdf";
    if (
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".webp") ||
      lower.endsWith(".gif")
    )
      return "image";

    // sometimes backend returns without extension but still image
    // fallback: treat as image if contains "image" keyword
    if (lower.includes("image")) return "image";

    return "file";
  };

  const handleImageFail = (postId) => {
    setBrokenImages((prev) => ({ ...prev, [postId]: true }));
  };

  const totalPosts = useMemo(() => posts.length, [posts]);

  return (
    <div className="min-h-screen bg-[#F3F6F9] py-12 px-4 sm:px-6 font-sans">
      {/* --- HEADER SECTION --- */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full text-[#002147] mb-4 shadow-sm">
          <MegaphoneIcon className="w-8 h-8" />
        </div>

        <h1 className="text-4xl font-extrabold text-[#002147] mb-3 tracking-tight">
          Latest Announcements
        </h1>

        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Stay updated with the latest news, events, and official circulars from the Library.
        </p>

        <p className="mt-3 text-sm text-slate-400">
          Total Posts: <b className="text-slate-600">{totalPosts}</b>
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* LOADING */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* POSTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => {
                const fileUrl = getFileUrl(post?.file_url);
                const fileType = getFileType(fileUrl);

                const isBroken = brokenImages[post?.id] === true;

                return (
                  <motion.div
                    key={post?.id || index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                    className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                  >
                    {/* IMAGE AREA */}
                    <div
                      className="relative h-56 bg-slate-100 overflow-hidden cursor-pointer"
                      onClick={() => setSelectedPost(post)}
                    >
                      {/* If image exists and not broken */}
                      {fileUrl && fileType === "image" && !isBroken ? (
                        <img
                          src={fileUrl}
                          alt={post?.title || "Post Image"}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={() => handleImageFail(post?.id)}
                        />
                      ) : fileUrl && fileType === "pdf" ? (
                        // PDF placeholder
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-50 border-b border-slate-100">
                          <DocumentTextIcon className="w-16 h-16 mb-2 opacity-40" />
                          <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                            PDF Document
                          </span>
                        </div>
                      ) : (
                        // Default placeholder
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 border-b border-slate-100">
                          <PhotoIcon className="w-16 h-16 mb-2 opacity-30" />
                          <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                            No Image
                          </span>
                        </div>
                      )}

                      {/* Date Badge */}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-[#002147] shadow-sm flex items-center gap-1.5">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        {post?.created_at
                          ? new Date(post.created_at).toLocaleDateString()
                          : "N/A"}
                      </div>

                      {/* Tag Badge */}
                      {post?.tags && (
                        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase shadow-md tracking-wider">
                          {post.tags}
                        </div>
                      )}
                    </div>

                    {/* CONTENT AREA */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3
                        className="text-xl font-bold text-slate-800 mb-3 line-clamp-2 group-hover:text-blue-700 transition-colors cursor-pointer"
                        onClick={() => setSelectedPost(post)}
                      >
                        {post?.title || "Untitled Announcement"}
                      </h3>

                      <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                        {post?.content || "Click below to view the details of this announcement."}
                      </p>

                      <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between gap-3">
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="text-sm font-bold text-[#002147] flex items-center gap-2 group/btn"
                        >
                          Read Full Notice
                          <ArrowLongRightIcon className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>

                        {/* Open file quick action */}
                        {fileUrl && (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-slate-500 hover:text-blue-700 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                            title="Open file"
                          >
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            Open
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* EMPTY STATE */}
            {!loading && posts.length === 0 && (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300 mt-8">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MegaphoneIcon className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No Announcements Yet</h3>
                <p className="text-slate-500 text-sm">
                  Check back later for updates from the library.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* =========================================================
          MODAL (DETAILS VIEW) - BEST VERSION
         ========================================================= */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10 transition-colors"
                title="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              {/* Modal Media (FULL IMAGE VIEW) */}
              <div className="w-full bg-slate-100 relative rounded-t-2xl overflow-hidden">
                {(() => {
                  const fileUrl = getFileUrl(selectedPost?.file_url);
                  const fileType = getFileType(fileUrl);
                  const isBroken = brokenImages[selectedPost?.id] === true;

                  // IMAGE FULL VIEW
                  if (fileUrl && fileType === "image" && !isBroken) {
                    return (
                      <div className="w-full bg-black/5">
                        <img
                          src={fileUrl}
                          alt={selectedPost?.title || "Post Image"}
                          className="w-full h-auto max-h-[75vh] object-contain mx-auto"
                          onError={() => handleImageFail(selectedPost?.id)}
                        />
                      </div>
                    );
                  }

                  // PDF VIEW PLACEHOLDER
                  if (fileUrl && fileType === "pdf") {
                    return (
                      <div className="py-14 flex flex-col items-center justify-center text-slate-500">
                        <DocumentTextIcon className="w-16 h-16 mb-3 opacity-50" />
                        <p className="font-bold">PDF Attached</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Click Open / Download below to view it.
                        </p>
                      </div>
                    );
                  }

                  // FALLBACK
                  return (
                    <div className="py-14 flex flex-col items-center justify-center text-slate-400">
                      <PhotoIcon className="w-16 h-16 mb-2 opacity-40" />
                      <span className="text-sm font-bold uppercase tracking-wider">
                        No Image Available
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    {selectedPost?.tags || "Notice"}
                  </span>

                  <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
                    <CalendarDaysIcon className="w-4 h-4" />
                    {selectedPost?.created_at
                      ? new Date(selectedPost.created_at).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold text-[#002147] mb-6 leading-tight">
                  {selectedPost?.title || "Untitled Announcement"}
                </h2>

                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap text-base">
                  {selectedPost?.content || "No details available."}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 text-right rounded-b-2xl flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                {/* File Actions */}
                <div className="flex gap-2 justify-end sm:justify-start">
                  {selectedPost?.file_url && (
                    <>
                      <a
                        href={getFileUrl(selectedPost.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:shadow-md transition flex items-center gap-2"
                      >
                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        Open
                      </a>

                      <a
                        href={getFileUrl(selectedPost.file_url)}
                        download
                        className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:shadow-md transition flex items-center gap-2"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Download
                      </a>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-6 py-2.5 bg-[#002147] text-white font-bold rounded-xl hover:bg-[#003366] transition-colors shadow-md hover:shadow-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LatestPosts;
