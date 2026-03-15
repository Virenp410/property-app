import api from "@/lib/auth/apiClient";
import { PRODUCT_KEY } from "@/lib/productKey";

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
