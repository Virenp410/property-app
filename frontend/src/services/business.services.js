import api from "@/lib/auth/apiClient";
import { PRODUCT_KEY } from "@/lib/productKey";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import { getClientAccessToken } from "@/lib/auth/clientAuth";
import { setAccessToken } from "@/lib/auth/apiClient";

const getProductKey = (value) => String(value || PRODUCT_KEY || "").trim();

const authHeaders = (productKey) => ({
  "x-product-key": getProductKey(productKey),
});

const isTransientUpstreamError = (error) => {
  const status = Number(error?.response?.status || 0);
  if (!status) return true; // network/DNS/CORS/proxy failure
  if (status >= 500 && status <= 599) return true;
  return false;
};

export const getBusinessAutocomplete = async (input) => {
  const query = String(input || "").trim();
  if (query.length < 2) return [];

  const response = await api.get("/v1/business/autocomplete", {
    params: { input: query },
    headers: authHeaders(PRODUCT_KEY),
  });

  const data = response.data || {};
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.businesses)) return data.businesses;
  if (Array.isArray(data.data?.businesses)) return data.data.businesses;
  if (Array.isArray(data.result?.businesses)) return data.result.businesses;
  return [];
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

export const createPaymentOrder = async (planId) => {
  // Restore access token if available
  const localToken = getClientAccessToken();
  if (localToken) {
    setAccessToken(localToken);
  }

  const deviceId = getOrCreateDeviceId();
  const productKey = getProductKey(PRODUCT_KEY);

  const response = await api.post("/v1/property/payments/create-order", {
    plan_id: planId,
  }, {
    params: {
      _t: Date.now(),
      product_key: productKey,
      ...(deviceId ? { device_id: deviceId } : {}),
    },
    headers: {
      ...authHeaders(productKey),
      ...(deviceId ? { "x-device-id": deviceId } : {}),
    },
  });

  return response.data;
};

export const verifyPropertyPayment = async ({ orderId, paymentSessionId }) => {
  const resolvedOrderId = String(orderId || "").trim();
  const resolvedSessionId = String(paymentSessionId || "").trim();

  // Restore access token if available
  const localToken = getClientAccessToken();
  if (localToken) {
    setAccessToken(localToken);
  }

  const deviceId = getOrCreateDeviceId();
  const productKey = getProductKey(PRODUCT_KEY);

  try {
    const response = await api.post(
      "/v1/property/payments/verify",
      {
        ...(resolvedOrderId ? { order_id: resolvedOrderId } : {}),
        ...(resolvedSessionId ? { payment_session_id: resolvedSessionId } : {}),
      },
      {
        params: {
          _t: Date.now(),
          product_key: productKey,
          ...(deviceId ? { device_id: deviceId } : {}),
        },
        headers: {
          ...authHeaders(productKey),
          ...(deviceId ? { "x-device-id": deviceId } : {}),
        },
      }
    );

    return response.data;
  } catch (err) {
    // Some environments rely on webhooks and may not expose a verify endpoint.
    // Treat verification as best-effort on the client side.
    return null;
  }
};

export const verifyOnboardingPayment = async ({ paymentSessionId }) => {
  const resolvedSessionId = String(paymentSessionId || "").trim();
  if (!resolvedSessionId) return null;

  const deviceId = getOrCreateDeviceId();
  const productKey = getProductKey(PRODUCT_KEY);

  try {
    const response = await api.post(
      "/v1/payment/verify",
      { payment_session_id: resolvedSessionId },
      {
        params: {
          _t: Date.now(),
          product_key: productKey,
          ...(deviceId ? { device_id: deviceId } : {}),
        },
        headers: {
          ...authHeaders(productKey),
          ...(deviceId ? { "x-device-id": deviceId } : {}),
        },
      }
    );

    return response.data;
  } catch {
    return null;
  }
};

export const getPropertyPlans = async () => {
  // Explicitly fetch local tokens
  const localToken = getClientAccessToken();
  if (localToken) {
    setAccessToken(localToken); // Update memory state specifically to avoid apiClient refresh hang
  }

  const response = await api.get("/v1/property/plans", {
    params: { _t: Date.now() },
    headers: {
      ...authHeaders(PRODUCT_KEY),
      ...(localToken ? { Authorization: `Bearer ${localToken}` } : {})
    },
  });

  const payload = response.data || {};
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.plans)) return payload.plans;
  if (Array.isArray(payload.data?.plans)) return payload.data.plans;
  if (Array.isArray(payload.result)) return payload.result;
  return [];
};

export const getPropertyCredits = async (branchId) => {
  const id = String(branchId || "").trim();
  if (!id) {
    throw new Error("branch_id is required to fetch property credits");
  }

  const localToken = getClientAccessToken();
  if (localToken) {
    setAccessToken(localToken);
  }

  const response = await api.get(`/v1/property/credits/${encodeURIComponent(id)}`, {
    params: { _t: Date.now() },
    headers: {
      ...authHeaders(PRODUCT_KEY),
      ...(localToken ? { Authorization: `Bearer ${localToken}` } : {}),
    },
  });

  const payload = response.data || {};
  const root = payload?.data ?? payload?.result ?? payload;

  // Parse history to calculate purchased and used credits
  const transactions = Array.isArray(root?.history)
    ? root.history
    : Array.isArray(root?.transactions)
    ? root.transactions
    : Array.isArray(payload?.transactions)
    ? payload.transactions
    : [];

  let purchased = 0;
  let used = 0;

  for (const tx of transactions) {
    const credits = Number(tx?.credits ?? tx?.amount ?? 0);
    const type = String(tx?.type || "").toLowerCase();
    if (type.includes("topup") || type.includes("purchase") || credits > 0) {
      purchased += Math.abs(credits);
    } else if (type.includes("usage") || type.includes("used") || credits < 0) {
      used += Math.abs(credits);
    }
  }

  return {
    available: root?.available_credits ?? root?.available ?? root?.balance ?? root?.credits_available ?? 0,
    purchased,
    used,
    transactions,
  };
};

export const getPropertyCounts = async () => {
  const localToken = getClientAccessToken();
  if (localToken) {
    setAccessToken(localToken);
  }

  try {
    const response = await api.get("/v1/property/property/branch/count", {
      params: { _t: Date.now() },
      headers: {
        ...authHeaders(PRODUCT_KEY),
        ...(localToken ? { Authorization: `Bearer ${localToken}` } : {}),
      },
    });

    const payload = response.data || {};
    const data = payload?.data ?? payload?.result ?? payload;

    return {
      total: Number(data?.total ?? 0),
      active: Number(data?.active ?? 0),
      expired: Number(data?.expired ?? 0),
    };
  } catch (error) {
    if (isTransientUpstreamError(error)) {
      return { total: 0, active: 0, expired: 0 };
    }
    throw error;
  }
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

  try {
    const response = await api.get(`/v1/business/gallery/${encodeURIComponent(id)}`, {
      params: { _t: Date.now() },
      headers: authHeaders(PRODUCT_KEY),
    });
    return extractGalleryItems(response.data || {});
  } catch (error) {
    if (error?.response?.status === 404) {
      return [];
    }
    if (isTransientUpstreamError(error)) {
      return [];
    }
    throw error;
  }
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

export const updateBranchDetails = async ({
  branchId,
  primary_number,
  country_code,
  whatsapp_country_code,
  whatsapp_number,
  business_email,
  branch_logo,
}) => {
  const id = String(branchId || "").trim();
  if (!id) throw new Error("branch_id is required to update branch details");

  const formData = new FormData();
  formData.append("branch_id", id);
  if (primary_number !== undefined) {
    formData.append("primary_number", String(primary_number || ""));
  }
  if (country_code !== undefined) {
    formData.append("country_code", String(country_code || ""));
  }
  if (whatsapp_country_code !== undefined) {
    formData.append("whatsapp_country_code", String(whatsapp_country_code || ""));
  }
  if (whatsapp_number !== undefined) {
    formData.append("whatsapp_number", String(whatsapp_number || ""));
  }
  if (business_email !== undefined) {
    formData.append("business_email", String(business_email || ""));
  }
  if (branch_logo) {
    formData.append("branch_logo", branch_logo);
  }

  const deviceId = getOrCreateDeviceId();
  if (deviceId) {
    formData.append("device_id", deviceId);
  }

  const response = await api.put("/v1/business/update", formData, {
    headers: authHeaders(PRODUCT_KEY),
  });

  return response.data;
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
