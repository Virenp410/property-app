import api from "@/lib/auth/apiClient";
import { PRODUCT_KEY } from "@/lib/productKey";
import { getOrCreateDeviceId } from "@/lib/deviceId";

const getProductKey = (value) => String(value || PRODUCT_KEY || "").trim();

const authHeaders = (productKey) => ({
  "x-product-key": getProductKey(productKey),
});

export const getBusinessAutocomplete = async (input) => {
  const query = String(input || "").trim();
  if (query.length < 2) return [];

  const response = await api.get("/v1/business/autocomplete", {
    params: { input: query },
    headers: authHeaders(PRODUCT_KEY),
  });

  return response.data?.businesses || [];
};

export const registerBusiness = async (data = {}) => {
  const payload = { ...data };
  const productKey = getProductKey(payload.product_key);
  delete payload.product_key;

  return api.post("/v1/business/create", payload, {
    headers: authHeaders(productKey),
  });
};

export const getOnboardingChargePreview = async (productKey) => {
  const response = await api.get("/v1/payment/onboarding-charge-preview", {
    headers: authHeaders(productKey),
  });

  return response.data;
};

const extractGalleryItems = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const root = payload?.data ?? payload;

  if (Array.isArray(root)) return root;

  const candidates = [
    root?.gallery,
    root?.gallery_items,
    root?.gallery_images,
    root?.gallery_data,
    root?.branch_gallery,
    root?.items,
    root?.images,
    root?.photos,
    root?.pictures,
    root?.documents,
    root?.media,
    root?.data,
    root?.result,
    root?.rows,
    root?.list,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

export const getBranchGallery = async (branchId) => {
  const id = String(branchId || "").trim();
  if (!id) {
    throw new Error("branch_id is required to fetch branch gallery");
  }

  const response = await api.get(`/v1/business/gallery/${encodeURIComponent(id)}`, {
    params: { _t: Date.now() },
    headers: authHeaders(PRODUCT_KEY),
  });

  return extractGalleryItems(response.data || {});
};

export const uploadBranchGalleryImages = async ({ branchId, files }) => {
  const id = String(branchId || "").trim();
  if (!id) throw new Error("branch_id is required to upload gallery images");

  const mediaFiles = (Array.isArray(files) ? files : []).filter(Boolean);
  if (!mediaFiles.length) throw new Error("At least one image is required");

  const formData = new FormData();
  mediaFiles.forEach((file) => {
    if (file) formData.append("media", file);
  });

  const deviceId = getOrCreateDeviceId();
  if (deviceId && typeof formData.append === "function") {
    formData.append("device_id", deviceId);
  }

  const response = await api.post(
    `/v1/business/gallery/${encodeURIComponent(id)}`,
    formData,
    {
      params: { _t: Date.now() },
      headers: authHeaders(PRODUCT_KEY),
    }
  );

  return extractGalleryItems(response.data || {});
};

export const deleteGalleryItem = async ({ galleryId }) => {
  const id = String(galleryId || "").trim();
  if (!id) throw new Error("gallery_id is required to delete gallery item");

  const response = await api.delete(
    `/v1/business/gallery/${encodeURIComponent(id)}`,
    {
      params: { _t: Date.now() },
      headers: authHeaders(PRODUCT_KEY),
    }
  );

  return response.data;
};

export const updateGalleryItem = async ({ galleryId, payload = {} }) => {
  const id = String(galleryId || "").trim();
  if (!id) throw new Error("gallery_id is required to update gallery item");

  const response = await api.put(
    `/v1/business/gallery/${encodeURIComponent(id)}`,
    payload,
    {
      params: { _t: Date.now() },
      headers: authHeaders(PRODUCT_KEY),
    }
  );

  return response.data;
};

export const verifyPanForBranch = async ({ pan, branch_id }) => {
  const panNumber = String(pan || "").trim().toUpperCase();
  const branchId = String(branch_id || "").trim();
  if (!panNumber) throw new Error("PAN is required");
  if (!branchId) throw new Error("branch_id is required for PAN verification");

  return api.post("/v1/verification/verify-pan", {
    pan_number: panNumber,
    branch_id: branchId,
  });
};

export const verifyGstForBranch = async ({ gstin, branch_id }) => {
  const gstNumber = String(gstin || "").trim().toUpperCase();
  const branchId = String(branch_id || "").trim();
  if (!gstNumber) throw new Error("GSTIN is required");
  if (!branchId) throw new Error("branch_id is required for GST verification");

  return api.post("/v1/verification/verify-gst", {
    gstin: gstNumber,
    branch_id: branchId,
  });
};
