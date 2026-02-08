// src/api/restrictedBookService.js
import apiClient from "./apiClient";

// ✅ API PREFIXES
const REQUEST_URL = "/api/restricted-requests";
const PERMISSION_URL = "/api/book-permissions";

// ✅ Standard error extractor
const extractErrorMessage = (error, fallback = "Something went wrong") => {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

// ✅ Ensure login (token check) - FIXED (uses "token")
const ensureLoggedIn = () => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("access_token") || // fallback old key (if any)
    sessionStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not logged in. Please login again.");
  }
};

/**
 * ==========================================================
 * 🟢 USER FUNCTIONS (Public/User Facing)
 * ==========================================================
 */

/**
 * ✅ Submit request for restricted book access
 * Backend endpoint can be:
 * - POST /api/restricted-requests/submit
 * - POST /api/restricted-requests/create
 * - POST /api/restricted-requests/
 */
const createRequest = async (data) => {
  try {
    ensureLoggedIn();

    if (!data?.book_id) throw new Error("Book ID is required");

    const payload = {
      book_id: data.book_id,
      reason: data.reason || "",
    };

    // ✅ Try multiple endpoints safely
    const endpointsToTry = [
      `${REQUEST_URL}/submit`,
      `${REQUEST_URL}/create`,
      `${REQUEST_URL}/`,
    ];

    let lastError = null;

    for (const endpoint of endpointsToTry) {
      try {
        const res = await apiClient.post(endpoint, payload);
        return res.data;
      } catch (err) {
        lastError = err;

        // If endpoint not found -> try next
        if (err?.response?.status === 404) continue;

        // If backend returns validation error or auth -> stop
        throw err;
      }
    }

    throw lastError || new Error("Failed to submit request");
  } catch (error) {
    console.error("❌ Error submitting access request:", error);
    throw new Error(extractErrorMessage(error, "Failed to submit request."));
  }
};

/**
 * ✅ Check current user access status for a book
 * Backend endpoint:
 * - GET /api/restricted-requests/check-status?book_id=123
 */
const checkAccessStatus = async (bookId) => {
  try {
    if (!bookId) return { status: "not_requested", can_read: false };

    const res = await apiClient.get(`${REQUEST_URL}/check-status`, {
      params: { book_id: bookId },
    });

    return res.data;
  } catch (error) {
    console.warn("⚠️ checkAccessStatus failed:", extractErrorMessage(error));
    return { status: "not_requested", can_read: false };
  }
};

/**
 * ✅ Get all requests for current logged-in user (notification bell)
 * Backend endpoint:
 * - GET /api/restricted-requests/my-requests
 */
const getMyRequests = async () => {
  try {
    ensureLoggedIn();
    const res = await apiClient.get(`${REQUEST_URL}/my-requests`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("❌ Error fetching my requests:", error);

    // UI safe fallback
    if (error?.response?.status === 401) return [];
    return [];
  }
};

/**
 * ==========================================================
 * 🔴 ADMIN REQUEST MANAGEMENT (Dashboard)
 * ==========================================================
 */

/**
 * ✅ Get all requests (Admin)
 * Backend endpoint:
 * - GET /api/restricted-requests/list
 */
const getAllRequests = async () => {
  try {
    ensureLoggedIn();
    const res = await apiClient.get(`${REQUEST_URL}/list`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("❌ Error fetching admin list:", error);
    throw new Error(extractErrorMessage(error, "Failed to fetch requests."));
  }
};

/**
 * ✅ Update request status (Admin)
 * Backend endpoint:
 * - PATCH /api/restricted-requests/{id}/status?status_update=approved
 */
const updateRequestStatus = async (requestId, status, reason = null) => {
  try {
    ensureLoggedIn();

    if (!requestId) throw new Error("Request ID is missing");
    if (!status) throw new Error("Status is required");

    const res = await apiClient.patch(
      `${REQUEST_URL}/${requestId}/status`,
      null,
      {
        params: {
          status_update: status,
          rejection_reason: reason,
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error("❌ Error updating status:", error);
    throw new Error(extractErrorMessage(error, "Failed to update status."));
  }
};

/**
 * ==========================================================
 * 🔵 ADMIN PERMISSION MANAGEMENT (Direct Access)
 * ==========================================================
 */

/**
 * ✅ Get permissions for a book
 * Backend endpoint:
 * - GET /api/book-permissions/book/{bookId}
 */
const getPermissionsForBook = async (bookId) => {
  try {
    ensureLoggedIn();
    if (!bookId) return [];

    const res = await apiClient.get(`${PERMISSION_URL}/book/${bookId}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    if (error?.response?.status === 404) return [];
    console.error("❌ Error fetching permissions:", error);
    throw new Error(extractErrorMessage(error, "Failed to fetch permissions."));
  }
};

/**
 * ✅ Assign permission
 * Backend endpoint:
 * - POST /api/book-permissions/
 */
const assignPermission = async (permissionData) => {
  try {
    ensureLoggedIn();

    if (!permissionData?.book_id || !permissionData?.user_id) {
      throw new Error("book_id and user_id are required");
    }

    const res = await apiClient.post(`${PERMISSION_URL}/`, permissionData);
    return res.data;
  } catch (error) {
    console.error("❌ Error assigning permission:", error);
    throw new Error(extractErrorMessage(error, "Failed to assign permission."));
  }
};

/**
 * ✅ Revoke permission
 * Backend endpoint:
 * - DELETE /api/book-permissions/{permissionId}
 */
const revokePermission = async (permissionId) => {
  try {
    ensureLoggedIn();

    if (!permissionId) throw new Error("Permission ID missing");

    const res = await apiClient.delete(`${PERMISSION_URL}/${permissionId}`);
    return res.data || { detail: "Permission revoked successfully" };
  } catch (error) {
    console.error("❌ Error revoking permission:", error);
    throw new Error(extractErrorMessage(error, "Failed to revoke permission."));
  }
};

/**
 * ==========================================================
 * ✅ EXPORT SERVICE (FIXED)
 * ==========================================================
 */

const restrictedBookService = {
  // User
  createRequest,
  requestAccess: createRequest, // alias
  checkAccessStatus,
  getMyRequests,

  // Admin
  getAllRequests,
  updateRequestStatus,

  // Permissions
  getPermissionsForBook,
  assignPermission,
  revokePermission,
};

// ✅ IMPORTANT: Export BOTH ways (to avoid import errors)
export { restrictedBookService };
export default restrictedBookService;
