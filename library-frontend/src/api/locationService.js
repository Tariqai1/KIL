// src/api/locationService.js
import apiClient from "./apiClient";

// ✅ API Base URL
const LOCATION_URL = "/api/locations/";

// ✅ Standard Error Extractor
const extractErrorMessage = (error, fallback = "Something went wrong") => {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

// ✅ Get All Locations
const getAllLocations = async () => {
  try {
    const response = await apiClient.get(LOCATION_URL);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("❌ Error fetching locations:", error.response?.data || error.message);
    throw { detail: extractErrorMessage(error, "Failed to fetch locations") };
  }
};

// ✅ Create Location
const createLocation = async (locationData) => {
  try {
    const payload = {
      name: locationData?.name?.trim(),
      rack: locationData?.rack?.trim() || null,
      shelf: locationData?.shelf?.trim() || null,
    };

    const response = await apiClient.post(LOCATION_URL, payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating location:", error.response?.data || error.message);
    throw { detail: extractErrorMessage(error, "Failed to create location") };
  }
};

// ✅ Update Location
const updateLocation = async (locationId, locationData) => {
  try {
    if (!locationId) throw { detail: "Location ID is required" };

    const payload = {
      name: locationData?.name?.trim(),
      rack: locationData?.rack?.trim() || null,
      shelf: locationData?.shelf?.trim() || null,
    };

    const response = await apiClient.put(`${LOCATION_URL}${locationId}/`, payload);
    return response.data;
  } catch (error) {
    console.error(`❌ Error updating location ${locationId}:`, error.response?.data || error.message);
    throw { detail: extractErrorMessage(error, "Failed to update location") };
  }
};

// ✅ Delete Location
const deleteLocation = async (locationId) => {
  try {
    if (!locationId) throw { detail: "Location ID is required" };

    const response = await apiClient.delete(`${LOCATION_URL}${locationId}/`);
    return response.data || { detail: "Location deleted successfully" };
  } catch (error) {
    console.error(`❌ Error deleting location ${locationId}:`, error.response?.data || error.message);

    // ✅ Better user-friendly error for FK issues
    if (error?.response?.status === 400 || error?.response?.status === 409) {
      throw { detail: "Cannot delete location: It is linked with existing books." };
    }

    throw { detail: extractErrorMessage(error, "Failed to delete location") };
  }
};

// ✅ Named Export (if you want)
export const locationService = {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
};

// ✅ Default Export (recommended)
export default locationService;
