import React, { useMemo, useState } from "react";
import postService from "../../api/postService";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const CreatePost = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const isImage = useMemo(() => file?.type?.startsWith("image/"), [file]);
  const isPdf = useMemo(() => file?.type === "application/pdf", [file]);

  // ---------------------------
  // Helpers
  // ---------------------------
  const resetForm = () => {
    setTitle("");
    setContent("");
    setFile(null);
    setPreview(null);
    setMessage({ type: "", text: "" });

    const input = document.getElementById("fileInput");
    if (input) input.value = "";
  };

  const validateFile = (selectedFile) => {
    if (!selectedFile) return true;

    // size check
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setMessage({
        type: "error",
        text: `File too large. Max allowed is ${MAX_FILE_SIZE_MB}MB.`,
      });
      return false;
    }

    // type check
    const allowed =
      selectedFile.type.startsWith("image/") ||
      selectedFile.type === "application/pdf";

    if (!allowed) {
      setMessage({
        type: "error",
        text: "Only Images (JPG/PNG/WebP) and PDF files are allowed.",
      });
      return false;
    }

    return true;
  };

  // ---------------------------
  // File Change
  // ---------------------------
  const handleFileChange = (e) => {
    setMessage({ type: "", text: "" });

    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!validateFile(selectedFile)) {
      e.target.value = "";
      return;
    }

    setFile(selectedFile);

    // Image preview
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  // ---------------------------
  // Submit
  // ---------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setMessage({ type: "error", text: "Title is required!" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("content", content);

    if (file) {
      formData.append("file", file);
    }

    try {
      await postService.createPost(formData);

      setMessage({
        type: "success",
        text: "✅ Post published successfully!",
      });

      // reset but keep success message for 2 sec
      setTimeout(() => {
        resetForm();
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "❌ Failed to publish post. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Admin Panel • Markaz Announcements
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Publish official notices, circulars, posters and PDF announcements for public users.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              ✍️ Create New Announcement
            </h2>

            {/* Message */}
            {message.text && (
              <div
                className={`mb-4 p-3 rounded-xl border text-sm font-semibold ${
                  message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Library will remain closed on Friday..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description / Details (Optional)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write detailed notice here..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 min-h-[160px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Tip: Keep it short and clear like official notices.
                </p>
              </div>

              {/* Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Upload Attachment (Image / PDF)
                </label>

                <input
                  id="fileInput"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 cursor-pointer"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Supported: JPG, PNG, WebP, PDF • Max {MAX_FILE_SIZE_MB}MB
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white transition ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Publishing..." : "🚀 Publish Post"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Right Preview Panel */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">📌 Preview</h3>

            {/* Preview Title */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Title</p>
              <p className="font-extrabold text-gray-900">
                {title.trim() ? title : "Your post title will appear here"}
              </p>
            </div>

            {/* Preview Content */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-gray-700 whitespace-pre-wrap">
                {content.trim()
                  ? content
                  : "Your post details will appear here..."}
              </p>
            </div>

            {/* Preview Media */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 mb-2">Attachment</p>

              {!file && (
                <div className="text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  No attachment selected.
                </div>
              )}

              {file && isImage && preview && (
                <div className="rounded-2xl overflow-hidden border bg-gray-50">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-56 object-contain bg-white"
                  />
                  <div className="p-3 text-xs text-gray-500 border-t bg-gray-50">
                    🖼️ Image Selected: <span className="font-semibold">{file.name}</span>
                  </div>
                </div>
              )}

              {file && isPdf && (
                <div className="rounded-2xl border bg-red-50 p-4 text-red-700">
                  <p className="font-bold">📄 PDF Selected</p>
                  <p className="text-sm mt-1">{file.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-xs text-gray-400 text-center">
          Markaz Posts System • Admin Publishing Panel
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
