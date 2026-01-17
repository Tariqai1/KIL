import React from "react";
import { FALLBACK_COVER, getCoverUrl } from "../../utils/cover";

const BookDetailsModal = ({ book, onClose }) => {
  if (!book) return null;

  const coverSrc = getCoverUrl(book?.cover_image_url || book?.cover_image);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Cover */}
          <div className="w-full md:w-[320px] bg-gray-100 flex items-center justify-center p-4">
            <img
              src={coverSrc}
              alt={book?.title || "Book Cover"}
              className="w-[260px] h-[360px] object-cover rounded-xl shadow-md"
              onError={(e) => {
                e.currentTarget.onerror = null; // ✅ infinite loop stop
                e.currentTarget.src = FALLBACK_COVER;
              }}
            />
          </div>

          {/* Details */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {book?.title || "Untitled"}
              </h2>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-700 mt-2">
              <b>Author:</b> {book?.author || "Unknown"}
            </p>

            <p className="text-gray-700 mt-2">
              <b>Language:</b> {book?.language_name || book?.language || "N/A"}
            </p>

            <p className="text-gray-700 mt-2">
              <b>Category:</b> {book?.category_name || book?.category || "N/A"}
            </p>

            <p className="text-gray-700 mt-3 leading-relaxed">
              {book?.description || "No description available."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;
