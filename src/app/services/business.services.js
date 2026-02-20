import axios from "axios"
import api from "./api"
import { setSessionTokens } from "./api"
import { getCookie, setCookie } from "./cookieStore"



const businessApi = axios.create({
  baseURL: "/api",
  withCredentials: true,
})

const DEFAULT_PRODUCT_KEY = "auto"
const DEFAULT_PRODUCT_NAME = "Auto"
const PRODUCT_KEY_CANDIDATES = ["auto", "seaneb"]
let businessRefreshBlocked = false
const PRODUCT_AUTO_READY_COOKIE = "product_auto_ready"
const BUSINESS_LIST_UNAVAILABLE_COOKIE = "business_list_unavailable"
const BUSINESS_LIST_FETCH_ENABLED =
  String(process.env.NEXT_PUBLIC_ENABLE_BUSINESS_LIST || "false").toLowerCase() === "true"

const getDefaultProductKey = () => DEFAULT_PRODUCT_KEY
const getDefaultProductName = () => DEFAULT_PRODUCT_NAME
const isTruthy = (value) => ["true", "1", "yes", "y"].includes(String(value || "").trim().toLowerCase())
const isClientSide = () => typeof window !== "undefined"
const isProductAutoReady = () => isClientSide() && isTruthy(getCookie(PRODUCT_AUTO_READY_COOKIE))
const markProductAutoReady = () => {
  if (isClientSide()) setCookie(PRODUCT_AUTO_READY_COOKIE, "true")
}
const isBusinessListUnavailable = () =>
  isClientSide() && isTruthy(getCookie(BUSINESS_LIST_UNAVAILABLE_COOKIE))
const markBusinessListUnavailable = () => {
  if (isClientSide()) setCookie(BUSINESS_LIST_UNAVAILABLE_COOKIE, "true")
}

const authStore = {
  getAccessToken: () => {
    if (typeof window === "undefined") return null
    return (
      getCookie("access_token_auto") ||
      getCookie("access_token") ||
      getCookie("access_token_seaneb") ||
      getCookie("token_auto") ||
      getCookie("token") ||
      null
    )
  },
  getCsrfToken: () => {
    if (typeof window === "undefined") return null
    return (
      getCookie("csrf_token_auto") ||
      getCookie("csrf_token_seaneb") ||
      getCookie("csrf_token") ||
      null
    )
  },
  getCsrfCandidates: () => {
    if (typeof window === "undefined") return []
    const values = [
      getCookie("csrf_token_auto"),
      getCookie("csrf_token_seaneb"),
      getCookie("csrf_token"),
    ]
      .map((item) => String(item || "").trim())
      .filter(Boolean)

    return [...new Set(values)]
  },
}

const bootstrapProductAuth = async () => {
  if (businessRefreshBlocked) {
    throw new Error("Session expired. Please login again.")
  }

  const csrfCandidates = authStore.getCsrfCandidates()
  if (!csrfCandidates.length) {
    businessRefreshBlocked = true
    throw new Error("CSRF token is required")
  }

  let lastError = null
  const productKeys = [
    String(getDefaultProductKey() || "").trim(),
    ...PRODUCT_KEY_CANDIDATES,
  ].filter(Boolean)

  for (const csrf of csrfCandidates) {
    for (const productKey of [...new Set(productKeys)]) {
      try {
        const res = await businessApi.post(
          "/v1/auth/refresh",
          { product_key: productKey },
          {
            headers: {
              "x-csrf-token": csrf,
              "Content-Type": "application/json",
            },
          }
        )

        const accessToken = res?.data?.access_token
        const csrfToken = res?.data?.csrf_token
        if (accessToken) {
          setSessionTokens({ access_token: accessToken, csrf_token: csrfToken })
        }

        return res?.data
      } catch (err) {
        lastError = err
      }
    }
  }

  businessRefreshBlocked = true
  throw lastError || new Error("Session expired. Please login again.")
}

const parseErrorMessage = (err, fallback) =>
  err?.response?.data?.error?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

const limitText = (value, max) => String(value || "").trim().slice(0, max)

const getProductKeyCandidates = () => {
  const preferred = String(getDefaultProductKey() || "").trim()
  const candidates = [preferred, "auto", "seaneb"]
  return [...new Set(candidates.filter(Boolean))]
}

const isRetryableAutocompleteError = (err) => {
  const status = Number(err?.response?.status || 0)
  const message = String(
    err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      err?.message ||
      ""
  ).toLowerCase()

  if ([400, 401, 403].includes(status)) return true
  if (message.includes("unauthorized")) return true
  if (message.includes("invalid input or product key missing")) return true
  if (message.includes("product key")) return true

  return false
}

const isInvalidOrInactiveProductError = (err) => {
  const status = Number(err?.response?.status || 0)
  const code = String(err?.response?.data?.error?.code || "").toUpperCase()
  const message = String(
    err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      err?.message ||
      ""
  ).toLowerCase()

  if (code.includes("PRODUCT")) return true
  if (message.includes("invalid or inactive product")) return true
  if (message.includes("product not found")) return true
  return status === 404 && message.includes("product")
}

const isProductContextError = (err) => {
  const status = Number(err?.response?.status || 0)
  const message = String(
    err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      err?.message ||
      ""
  ).toLowerCase()

  if ([401, 403].includes(status)) return true
  if (status === 400 && (message.includes("product key") || message.includes("product"))) return true

  return isInvalidOrInactiveProductError(err)
}

const isCsrfRequiredError = (err) => {
  const status = Number(err?.response?.status || 0)
  const code = String(err?.response?.data?.error?.code || "").toUpperCase()
  const message = String(
    err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      err?.message ||
      ""
  ).toLowerCase()

  return (
    status === 403 &&
    (code.includes("CSRF") || message.includes("csrf token is required") || message.includes("csrf"))
  )
}

const ensureBusinessProductContext = async () => {
  if (isProductAutoReady()) return

  const productKey = getDefaultProductKey()
  const productName = getDefaultProductName()
  const listEndpoints = ["/v1/products", "/products"]
  const createEndpoints = ["/v1/products", "/products"]

  let lastError = null
  for (const endpoint of listEndpoints) {
    try {
      const res = await api.get(endpoint, {
        params: { product_key: productKey },
        headers: { "x-product-key": productKey },
      })
      const payload = res?.data
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.products)
        ? payload.products
        : Array.isArray(payload?.data?.products)
        ? payload.data.products
        : Array.isArray(payload?.result?.products)
        ? payload.result.products
        : Array.isArray(payload?.result?.data)
        ? payload.result.data
        : Array.isArray(payload?.result?.data?.products)
        ? payload.result.data.products
        : [];

      const hasAuto = list.some((item) => {
        const key = String(item?.product_key || item?.key || "").trim().toLowerCase();
        return key === productKey;
      });

      if (hasAuto) {
        markProductAutoReady()
        return
      }
    } catch (err) {
      const status = Number(err?.response?.status || 0)
      if (![404, 405].includes(status)) {
        lastError = err
        break
      }
    }
  }

  for (const endpoint of createEndpoints) {
    try {
      await api.post(endpoint, {
        product_key: productKey,
        product_name: productName,
      }, {
        headers: { "x-product-key": productKey },
      })
      markProductAutoReady()
      return
    } catch (err) {
      if (err?.response?.status === 409) {
        markProductAutoReady()
        return
      }
      lastError = err
      if (![404, 405].includes(Number(err?.response?.status || 0))) {
        break
      }
    }
  }

  try {
    throw lastError
  } catch (err) {
    console.warn("[business.service] ensure product create failed:", err?.response?.data || err?.message || err)
  }
}

export const ensureDefaultProductAuto = async () => {
  try {
    await ensureBusinessProductContext()
    return true
  } catch {
    return false
  }
}

const withBusinessRecovery = async (requestFn) => {
  if (businessRefreshBlocked) {
    throw new Error("Session expired. Please login again.")
  }

  try {
    return await requestFn()
  } catch (err) {
    const status = Number(err?.response?.status || 0)

    // Access token expired in business flow: attempt bootstrap recovery and retry once.
    if (status === 401) {
      try {
        // Try bootstrap flow which recovers product auth and tokens
        await bootstrapProductAuth()
      } catch (bootstrapErr) {
        businessRefreshBlocked = true
        const message = String(
          bootstrapErr?.response?.data?.error?.message ||
            bootstrapErr?.response?.data?.message ||
            bootstrapErr?.message ||
            ""
        ).toLowerCase()

        const isRefreshTokenMissing =
          message.includes("refresh token") ||
          message.includes("invalid refresh token") ||
          message.includes("session expired")

        if (isCsrfRequiredError(bootstrapErr) || isRefreshTokenMissing) {
          throw new Error(parseErrorMessage(bootstrapErr, "Session expired. Please login again."))
        }

        throw new Error(
          parseErrorMessage(
            bootstrapErr,
            "Session expired. Please login again."
          )
        )
      }

      // If bootstrap recovered access token, retry original request.
      if (authStore.getAccessToken()) {
        businessRefreshBlocked = false
        return requestFn()
      }

      businessRefreshBlocked = true
      throw new Error("Session expired. Please login again.")
    }

    // Product context mismatch: ensure product exists, refresh token context, retry once.
    if (isInvalidOrInactiveProductError(err)) {
      await ensureBusinessProductContext()
      return requestFn()
    }

    throw err
  }
}

/**
 * Business name autocomplete
 * GET /api/v1/business/autocomplete
 * Required:
 * - header: x-product-key
 * - query: input (min 2 chars)
 */
export const getBusinessAutocomplete = async (input) => {
  const query = String(input || "").trim()
  if (query.length < 2) return []

  try {
    const productKeys = getProductKeyCandidates()
    let lastError = null

    for (const productKey of productKeys) {
      try {
        const makeRequest = () =>
          businessApi.get("/v1/business/autocomplete", {
            params: { input: query },
            headers: {
              ...getAuthHeaders(),
              "x-product-key": productKey,
            },
          })

        const res = await withBusinessRecovery(makeRequest)
        const body = res?.data
        const list = Array.isArray(body)
          ? body
          : body?.businesses || body?.data?.businesses || body?.data || []

        return Array.isArray(list) ? list : []
      } catch (err) {
        lastError = err
        if (
          !isInvalidOrInactiveProductError(err) &&
          !isRetryableAutocompleteError(err)
        ) {
          throw err
        }
      }
    }

    throw lastError || new Error("Business autocomplete failed")
  } catch (err) {
    const status = Number(err?.response?.status || 0)
    const message = String(err?.message || "").toLowerCase()
    if (
      [401, 403].includes(status) ||
      message.includes("session expired") ||
      message.includes("login again") ||
      message.includes("unauthorized")
    ) {
      throw new Error("Session expired. Please login again.")
    }
    if ([500, 502, 503, 504].includes(status)) {
      return []
    }
    console.error("[business.service] getBusinessAutocomplete failed:", parseErrorMessage(err, "Autocomplete failed"))
    return []
  }
}

const getAuthHeaders = ({ includeProductKey = false, productKey } = {}) => {
  const headers = {}
  const token = authStore.getAccessToken()
  const csrf = authStore.getCsrfToken()

  if (token) headers.Authorization = `Bearer ${token}`
  if (csrf) headers["x-csrf-token"] = csrf
  if (includeProductKey) headers["x-product-key"] = String(productKey || getDefaultProductKey()).trim()

  return headers
}

/**
 * Register a business for a user
 * POST /api/v1/business/create
 * Schema aligned with API docs screenshot (flat address + branch fields)
 */
export const registerBusiness = async (data = {}) => {
  const {
    business_name,
    businessName,
    display_name,
    displayName,
    main_category_id,
    mainCategoryId,
    business_type,
    businessType,
    seaneb_id,
    seanebId,
    primary_number,
    primaryNumber,
    whatsapp_number,
    whatsappNumber,
    business_email,
    businessEmail,
    about_branch,
    aboutBranch,
    address,
    business_location,
    businessLocation,
    landmark,
    place_id,
    placeId,
    latitude,
    longitude,
    pan,
    pan_number,
    gst,
    gstin,
    product_key,
    productKey,
  } = data

  const finalBusinessName = limitText(business_name ?? businessName ?? "", 30)
  const finalBusinessType = business_type ?? businessType
  const finalPlaceId = String(place_id ?? placeId ?? "").trim()

  if (!finalBusinessName) {
    return Promise.reject(new Error("Business name is required"))
  }

  if (finalBusinessType === undefined || finalBusinessType === null || finalBusinessType === "") {
    return Promise.reject(new Error("Business type is required"))
  }

  if (!finalPlaceId) {
    return Promise.reject(new Error("Business location is required"))
  }

  const effectiveProductKey = String(product_key || productKey || getDefaultProductKey()).trim()

  const payload = {
    business_name: finalBusinessName,
    display_name: limitText(display_name || displayName || finalBusinessName, 30),
    main_category_id: (main_category_id || mainCategoryId || "").trim(),
    business_type: Number.isNaN(Number(finalBusinessType)) ? finalBusinessType : Number(finalBusinessType),
    seaneb_id: (seaneb_id || seanebId || "").trim(),
    primary_number: String(primary_number || primaryNumber || "").trim(),
    whatsapp_number: String(whatsapp_number || whatsappNumber || "").trim(),
    business_email: String(business_email || businessEmail || "").trim(),
    about_branch: (about_branch || aboutBranch || "Head office branch").trim(),
    address: (address || business_location || businessLocation || "").trim(),
    landmark: String(landmark || "").trim(),
    place_id: finalPlaceId,
    latitude: latitude !== undefined && latitude !== null && latitude !== "" ? Number(latitude) : 0,
    longitude: longitude !== undefined && longitude !== null && longitude !== "" ? Number(longitude) : 0,
    product_key: effectiveProductKey,
  }

  const finalPan = String(pan_number || pan?.pan_number || pan || "").trim().toUpperCase()
  if (finalPan) payload.pan = { pan_number: finalPan }

  const finalGst = String(gstin || gst?.gstin || "").trim().toUpperCase()
  if (finalGst) payload.gst = { gstin: finalGst }

  // Remove empty optional fields to match backend validation expectations
  Object.keys(payload).forEach((key) => {
    if (payload[key] === "") delete payload[key]
  })

  console.log("registerBusiness payload:", JSON.stringify(payload, null, 2))

  const productKeys = [...new Set([effectiveProductKey, "seaneb", "auto"].filter(Boolean))]

  let lastError = null

  for (const key of productKeys) {
    try {
      payload.product_key = key
      const makeCreate = () =>
        businessApi.post("/v1/business/create", payload, {
          headers: getAuthHeaders({ includeProductKey: true, productKey: key }),
        })
      return await withBusinessRecovery(makeCreate)
    } catch (err) {
      lastError = err
      const status = Number(err?.response?.status || 0)
      if ([404, 405, 502, 503, 504].includes(status)) {
        try {
          console.warn(
            "[business.service] /business/create unavailable, falling back to /business/register"
          )
          const makeRegister = () =>
            businessApi.post("/v1/business/register", payload, {
              headers: getAuthHeaders({ includeProductKey: true, productKey: key }),
            })
          return await withBusinessRecovery(makeRegister)
        } catch (fallbackErr) {
          lastError = fallbackErr
          if (!isProductContextError(fallbackErr)) {
            throw fallbackErr
          }
        }
      } else if (!isProductContextError(err)) {
        throw err
      }
    }
  }

  if (lastError) {
    throw lastError
  }

  throw new Error("Business registration failed")
}

// Backwards compatibility: some callers import `createBusiness`.
export const createBusiness = async (data = {}) => {
  return registerBusiness(data)
}

/**
 * Create a branch under existing business
 * POST /api/v1/business/create-branch
 */
export const createBusinessBranch = async (data = {}) => {
  const {
    business_id,
    businessId,
    seaneb_id,
    seanebId,
    primary_number,
    primaryNumber,
    whatsapp_number,
    whatsappNumber,
    business_email,
    businessEmail,
    about_branch,
    aboutBranch,
    address,
    landmark,
    place_id,
    placeId,
    pan,
    gstin,
  } = data

  const finalBusinessId = String(business_id ?? businessId ?? "").trim()
  const finalPlaceId = String(place_id ?? placeId ?? "").trim()

  if (!finalBusinessId) {
    return Promise.reject(new Error("business_id is required"))
  }

  if (!finalPlaceId) {
    return Promise.reject(new Error("place_id is required"))
  }

  const payload = {
    business_id: finalBusinessId,
    seaneb_id: String(seaneb_id || seanebId || "").trim(),
    primary_number: String(primary_number || primaryNumber || "").trim(),
    whatsapp_number: String(whatsapp_number || whatsappNumber || "").trim(),
    business_email: String(business_email || businessEmail || "").trim(),
    about_branch: String(about_branch || aboutBranch || "").trim(),
    address: String(address || "").trim(),
    landmark: String(landmark || "").trim(),
    place_id: finalPlaceId,
    pan: {
      pan_number: String(pan || "").trim().toUpperCase(),
    },
    gst: {
      gstin: String(gstin || "").trim().toUpperCase(),
    },
    product_key: getDefaultProductKey(),
  }

  const makeRequest = () =>
    businessApi.post("/v1/business/create-branch", payload, {
      headers: getAuthHeaders({ includeProductKey: true }),
    })

  return withBusinessRecovery(makeRequest)
}

/**
 * Verify PAN for a branch
 * POST /api/v1/verification/verify-pan
 */
export const verifyPanForBranch = async ({ pan, branch_id }) => {
  if (!pan) {
    return Promise.reject(new Error("PAN is required"))
  }

  if (!branch_id) {
    return Promise.reject(new Error("branch_id is required for PAN verification"))
  }

  try {
    const makeRequest = () =>
      businessApi.post(
        "/v1/verification/verify-pan",
        {
          pan: String(pan).trim().toUpperCase(),
          branch_id: String(branch_id),
          product_key: getDefaultProductKey(),
        },
        { headers: getAuthHeaders({ includeProductKey: true }) }
      )

    return await withBusinessRecovery(makeRequest)
  } catch (err) {
    throw new Error(parseErrorMessage(err, "PAN verification failed"))
  }
}

/**
 * Verify GST for a branch
 * POST /api/v1/verification/verify-gst
 */
export const verifyGstForBranch = async ({ gstin, branch_id }) => {
  if (!gstin) {
    return Promise.reject(new Error("GSTIN is required"))
  }

  if (!branch_id) {
    return Promise.reject(new Error("branch_id is required for GST verification"))
  }

  try {
    const makeRequest = () =>
      businessApi.post(
        "/v1/verification/verify-gst",
        {
          gstin: String(gstin).trim().toUpperCase(),
          branch_id: String(branch_id),
          product_key: getDefaultProductKey(),
        },
        { headers: getAuthHeaders({ includeProductKey: true }) }
      )

    return await withBusinessRecovery(makeRequest)
  } catch (err) {
    throw new Error(parseErrorMessage(err, "GST verification failed"))
  }
}

/**
 * Get business details
 * GET /business/:id
 */
export const getBusinessDetails = async (businessId) => {
  if (!businessId) {
    return Promise.reject(new Error("Business ID is required"))
  }

  console.log(`[business.service] Fetching business details for ID: ${businessId}`)
  return api.get(`/business/${businessId}`)
}

/**
 * Update business information
 * PUT /business/:id
 */
export const updateBusiness = async (businessId, data = {}) => {
  if (!businessId) {
    return Promise.reject(new Error("Business ID is required"))
  }

  const payload = {
    business_name: data.business_name || data.businessName,
    business_type: data.business_type || data.businessType,
    business_description: data.business_description || data.businessDescription,
    registration_number: data.registration_number || data.registrationNumber,
  }

  console.log(
    `[business.service] Updating business ${businessId}:`,
    JSON.stringify(payload, null, 2)
  )
  return api.put(`/business/${businessId}`, payload)
}

/**
 * Get user's business list
 * GET /v1/business/list
 */
export const getBusinessList = async () => {
  if (!BUSINESS_LIST_FETCH_ENABLED) {
    return { data: { businesses: [] } };
  }

  const LIST_UNAVAILABLE_COOKIE = "business_list_unavailable";
  const isUnavailable =
    String(getCookie(LIST_UNAVAILABLE_COOKIE) || "").trim().toLowerCase() === "true";
  if (isUnavailable) {
    return { data: { businesses: [] } };
  }

  const endpoints = ["/v1/business/list", "/business/list"];
  const keys = ["auto", "seaneb"];
  let lastError = null;

  for (const endpoint of endpoints) {
    for (const key of keys) {
      try {
        const makeGet = () =>
          businessApi.get(endpoint, {
            params: { product_key: key },
            headers: getAuthHeaders({ includeProductKey: true, productKey: key }),
          });
        return await withBusinessRecovery(makeGet);
      } catch (err) {
        lastError = err;
      }

      try {
        const makePost = () =>
          businessApi.post(
            endpoint,
            { product_key: key },
            { headers: getAuthHeaders({ includeProductKey: true, productKey: key }) }
          );
        return await withBusinessRecovery(makePost);
      } catch (err) {
        lastError = err;
      }
    }
  }

  if (lastError) {
    const status = Number(lastError?.response?.status || 0);
    if (status === 404) {
      setCookie(LIST_UNAVAILABLE_COOKIE, "true", { days: 1 });
    }
    console.warn("[business.service] business list unavailable:", parseErrorMessage(lastError, "Unavailable"));
  }
  return { data: { businesses: [] } };
}

/**
 * Delete a business
 * DELETE /business/:id
 */
export const deleteBusiness = async (businessId) => {
  if (!businessId) {
    return Promise.reject(new Error("Business ID is required"))
  }

  console.log(`[business.service] Deleting business ${businessId}`)
  return api.delete(`/business/${businessId}`)
}
