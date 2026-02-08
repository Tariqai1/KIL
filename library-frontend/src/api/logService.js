// src/api/logService.js
import apiClient from "./apiClient";

const LOGS_URL = "/api/logs/";

/**
 * ✅ Standard error extractor (frontend friendly)
 */
const extractErrorMessage = (error, fallback = "Failed to fetch audit logs") => {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

/**
 * ✅ Normalize filters (safe + backend-friendly)
 * Backend expects snake_case params:
 * user_id, action_type, target_type, limit, skip
 */
const normalizeFilters = (filters = {}) => {
  const params = {
    limit: Number.isFinite(filters.limit) ? filters.limit : 100,
    skip: Number.isFinite(filters.skip) ? filters.skip : 0,
  };

  // userId safe parse
  if (
    filters.userId !== undefined &&
    filters.userId !== null &&
    String(filters.userId).trim() !== ""
  ) {
    const parsed = parseInt(filters.userId, 10);
    if (!Number.isNaN(parsed)) params.user_id = parsed;
  }

  // actionType safe
  if (filters.actionType && String(filters.actionType).trim()) {
    params.action_type = String(filters.actionType).trim();
  }

  // targetType safe
  if (filters.targetType && String(filters.targetType).trim()) {
    params.target_type = String(filters.targetType).trim();
  }

  return params;
};

/**
 * ✅ Validate response data
 */
const normalizeLogsResponse = (data) => {
  if (Array.isArray(data)) return data;
  return [];
};

/**
 * ==========================================================
 * ✅ Fetch audit logs
 * Supports: limit, skip, userId, actionType, targetType
 * ==========================================================
 */
const getLogs = async (filters = {}, options = {}) => {
  try {
    const params = normalizeFilters(filters);

    // ✅ Abort support (optional)
    const response = await apiClient.get(LOGS_URL, {
      params,
      signal: options.signal, // if you pass AbortController.signal
    });

    return normalizeLogsResponse(response.data);
  } catch (error) {
    // ✅ If request cancelled
    if (error?.name === "CanceledError") {
      console.warn("⚠️ Logs request cancelled");
      return [];
    }

    // ✅ If unauthorized
    if (error?.response?.status === 401) {
      console.warn("🚫 Unauthorized: Please login again.");
      throw { detail: "Session expired. Please login again." };
    }

    console.error("❌ Error fetching logs:", error?.response?.data || error?.message);

    throw {
      detail: extractErrorMessage(error),
      status: error?.response?.status || 500,
    };
  }
};

/**
 * ✅ Recent logs helper
 */
const getRecentLogs = async (limit = 5) => {
  return getLogs({ limit, skip: 0 });
};

/**
 * ✅ Pagination helper (optional)
 * Example:
 * const { logs, hasNext } = await logService.getLogsPage(1, 25, filters)
 */
const getLogsPage = async (page = 1, perPage = 25, filters = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePerPage = Math.max(1, Number(perPage) || 25);

  const skip = (safePage - 1) * safePerPage;

  const logs = await getLogs({
    ...filters,
    limit: safePerPage,
    skip,
  });

  return {
    logs,
    page: safePage,
    perPage: safePerPage,
    hasNext: logs.length === safePerPage,
  };
};

/**
 * ✅ Export service (named + default)
 */
export const logService = {
  getLogs,
  getRecentLogs,
  getLogsPage, // optional
};

export default logService;
