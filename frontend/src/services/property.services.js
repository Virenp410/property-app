import api from "@/lib/auth/apiClient";

export const getPropertyDetails = async (propertyId) => {
  const id = String(propertyId || "").trim();
  if (!id) {
    throw new Error("Missing property ID for details request.");
  }

  try {
    const response = await api.get(`/v1/property/property/${encodeURIComponent(id)}`);
    // API returns { success: true, data: { property_details, branch_details } }
    // Extract the nested data object
    return response.data?.data || response.data;
  } catch (error) {
    // Handle different error types
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      throw new Error("Request timed out. The server took too long to respond. Please try again.");
    }
    if (error.response?.status === 404) {
      throw new Error("Property not found. It may have been deleted.");
    }
    if (error.response?.status === 403) {
      throw new Error("You don't have permission to view this property.");
    }
    if (error.response?.status >= 500) {
      throw new Error("Server error. Please try again later.");
    }
    if (!error.response) {
      throw new Error("Network error. Please check your connection.");
    }
    
    const message = error.response?.data?.message || error.message || "Failed to load property details";
    throw new Error(message);
  }
};
