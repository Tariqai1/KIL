import React, { useEffect, useMemo, useState } from "react";
import postService from "../../api/postService";

// ✅ Backend URL for static files (images/pdf)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// -------------------------------
// Small UI Helpers
// -------------------------------
const SkeletonCard = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-3 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-5/6 bg-gray-200 rounded" />
      </div>

      <div className="h-64 bg-gray-200" />
    </div>
  );
};

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

const getFileUrl = (file_url) => {
  if (!file_url) return null;
  // file_url example: /static/uploads/posts/abc.jpg
  // Make full URL:
  return `${API_BASE_URL}${file_url}`;
};

const MarkazFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await postService.getPublicPosts(0, 30);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load Markaz updates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const emptyState = useMemo(() => !loading && posts.length === 0, [loading, posts]);

  const openImagePreview = (imgUrl, title) => {
    setPreviewImage(imgUrl);
    setPreviewTitle(title || "Preview");
    setPreviewOpen(true);
  };

  const closeImagePreview = () => {
    setPreviewOpen(false);
    setPreviewImage(null);
    setPreviewTitle("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                📢 Markaz Updates
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Official announcements, notices, circulars and important updates.
              </p>
            </div>

            <button
              onClick={fetchPosts}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-semibold transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
            <p className="font-semibold">⚠️ {error}</p>
            <p className="text-sm mt-1">Please check your internet or backend server.</p>
          </div>
        )}

        {/* Empty */}
        {emptyState && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="text-lg font-bold text-gray-900">No announcements yet</h2>
            <p className="text-gray-500 mt-1">
              When admin publishes updates, they will appear here.
            </p>
          </div>
        )}

        {/* Posts */}
        {!loading && !error && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post) => {
              const fullFileUrl = getFileUrl(post.file_url);

              return (
                <div
                  key={post.id}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition"
                >
                  {/* Header */}
                  <div className="p-4 sm:p-5 flex items-center gap-3 border-b bg-gray-50">
                    <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      MK
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">
                        {post.author_name || "Markaz Admin"}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                    </div>

                    <div className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      Official
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
                      {post.title}
                    </h2>

                    {post.content && (
                      <p className="mt-3 text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>
                    )}
                  </div>

                  {/* Media */}
                  {fullFileUrl && (
                    <div className="border-t bg-gray-50">
                      {post.media_type === "image" ? (
                        <div className="p-4 sm:p-5">
                          <div className="rounded-2xl overflow-hidden border bg-white shadow-sm">
                            {/* Image wrapper with clean fit */}
                            <div className="w-full bg-gray-100">
                              <img
                                src={fullFileUrl}
                                alt={post.title}
                                loading="lazy"
                                className="w-full max-h-[520px] object-contain cursor-zoom-in"
                                onClick={() => openImagePreview(fullFileUrl, post.title)}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://dummyimage.com/1200x600/e5e7eb/111827&text=Image+Not+Available";
                                }}
                              />
                            </div>

                            <div className="p-3 flex items-center justify-between">
                              <p className="text-xs text-gray-500">
                                Click image to view full size
                              </p>
                              <button
                                onClick={() => openImagePreview(fullFileUrl, post.title)}
                                className="text-sm font-semibold px-3 py-1 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
                              >
                                🔍 Preview
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : post.media_type === "pdf" ? (
                        <div className="p-4 sm:p-5">
                          <a
                            href={fullFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                                📄
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">View PDF Notice</p>
                                <p className="text-xs text-gray-500">
                                  Click to open/download the document
                                </p>
                              </div>
                            </div>

                            <span className="text-sm font-semibold px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition">
                              Open
                            </span>
                          </a>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={closeImagePreview}
        >
          <div
            className="bg-white rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-1">
                {previewTitle}
              </h3>
              <button
                onClick={closeImagePreview}
                className="px-3 py-1 rounded-xl border border-gray-200 hover:bg-gray-100 font-semibold"
              >
                ✖ Close
              </button>
            </div>

            <div className="bg-gray-100 flex items-center justify-center">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkazFeed;
