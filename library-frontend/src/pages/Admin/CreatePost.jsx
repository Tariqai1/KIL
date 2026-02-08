import React, { useMemo, useState } from "react";
import { 
    CloudArrowUpIcon, 
    PhotoIcon, 
    DocumentTextIcon, 
    XMarkIcon 
} from "@heroicons/react/24/outline";
import postService from "../../api/postService";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const CreatePost = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState(""); // New: Tags for filtering

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
    setTags("");
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
    formData.append("tags", tags); // Optional tags

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
      }, 2000);
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
    <div className="min-h-screen bg-[#F3F6F9] pb-20">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-extrabold text-[#002147]">
            Create New Post
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Publish official notices, circulars, event photos, or PDF announcements.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN: Form --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Alert Message */}
            {message.text && (
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold animate-in fade-in slide-in-from-top-2 ${
                  message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                <span>{message.type === "success" ? "🎉" : "⚠️"}</span>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Card 1: Content Details */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
                <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">
                    📝 Post Details
                </h2>
                
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Post Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Annual Library Meeting 2024"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#002147] focus:border-transparent outline-none transition-all font-medium"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description / Message
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write the detailed announcement here..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 min-h-[160px] focus:ring-2 focus:ring-[#002147] focus:border-transparent outline-none transition-all resize-y"
                  />
                </div>

                {/* Tags (Optional Improvement) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Tags / Category (Optional)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. Notice, Event, Urgent"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#002147] outline-none"
                  />
                </div>
              </div>

              {/* Card 2: File Upload (Improved UI) */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4 flex justify-between">
                    <span>📎 Attachments</span>
                    <span className="text-xs font-normal text-gray-500 mt-1">Max 10MB</span>
                </h2>

                <div className="relative group">
                    <input
                        id="fileInput"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                        file ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50 group-hover:border-[#002147] group-hover:bg-blue-50"
                    }`}>
                        {file ? (
                            <>
                                {isImage ? <PhotoIcon className="w-12 h-12 text-green-600 mb-2" /> : <DocumentTextIcon className="w-12 h-12 text-red-600 mb-2" />}
                                <p className="font-bold text-gray-800">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <p className="text-xs text-green-600 font-bold mt-2">Click to change file</p>
                            </>
                        ) : (
                            <>
                                <CloudArrowUpIcon className="w-12 h-12 text-gray-400 group-hover:text-[#002147] mb-3 transition-colors" />
                                <p className="font-bold text-gray-700">Click to upload or drag and drop</p>
                                <p className="text-sm text-gray-500 mt-1">SVG, PNG, JPG or PDF</p>
                            </>
                        )}
                    </div>
                </div>

                {/* ✅ IMAGE SIZE INSTRUCTION */}
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                    <p className="font-bold mb-1">💡 Recommended Image Size:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
                        <li><strong>Landscape (Best for Web):</strong> 1200 x 630 px</li>
                        <li><strong>Square (Instagram Style):</strong> 1080 x 1080 px</li>
                        <li>Ensure text on image is readable.</li>
                    </ul>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all transform active:scale-95 ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#002147] hover:bg-[#003366]"
                  }`}
                >
                  {loading ? "Publishing..." : "🚀 Publish Post"}
                </button>
                
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="px-8 py-3.5 rounded-xl font-bold border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
                >
                  Reset
                </button>
              </div>

            </form>
          </div>

          {/* --- RIGHT COLUMN: Live Preview --- */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
                <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-wider text-xs ml-1">
                    <span>👁️ Live Preview</span>
                </div>

                {/* Preview Card */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    {/* Preview Image */}
                    <div className="w-full bg-gray-100 min-h-[200px] flex items-center justify-center border-b border-gray-100 relative">
                        {file && isImage && preview ? (
                            <img src={preview} alt="Preview" className="w-full h-auto object-cover" />
                        ) : file && isPdf ? (
                            <div className="text-center py-10">
                                <DocumentTextIcon className="w-16 h-16 text-red-500 mx-auto mb-2" />
                                <span className="font-bold text-gray-700">PDF Document</span>
                            </div>
                        ) : (
                            <div className="text-gray-300 flex flex-col items-center">
                                <PhotoIcon className="w-12 h-12" />
                                <span className="text-xs mt-2">No Image</span>
                            </div>
                        )}
                        
                        {/* Remove Image Button (Only in preview) */}
                        {file && (
                             <button onClick={() => {setFile(null); setPreview(null);}} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition">
                                <XMarkIcon className="w-4 h-4" />
                             </button>
                        )}
                    </div>

                    {/* Preview Content */}
                    <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md uppercase">
                                {tags || "News"}
                            </span>
                            <span className="text-[10px] text-gray-400">Just now</span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                            {title || "Your Post Title..."}
                        </h3>

                        <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                            {content || "The description of your post will appear here. It gives users a preview of how the announcement will look on the dashboard."}
                        </p>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreatePost;