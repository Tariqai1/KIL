export const FALLBACK_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <text x="50%" y="50%" font-size="22" fill="#64748b"
        text-anchor="middle" dominant-baseline="middle">
        No Cover
      </text>
    </svg>
  `);

export const getMediaUrl = (path) => {
  if (!path) return null;

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  let clean = String(path).replace(/\\/g, "/");

  if (clean.startsWith("http")) return clean;
  if (!clean.startsWith("/")) clean = "/" + clean;

  return API_BASE + clean;
};
