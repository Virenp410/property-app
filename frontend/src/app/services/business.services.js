import axios from "axios"
import api, { setSessionTokens } from "./api"
import { getCookie, setCookie } from "./cookieStore"
import { PRODUCT_KEY, PRODUCT_NAME } from "./productKey"



const businessApi = axios.create({
  baseURL: "/api",
  withCredentials: true,
})

const DEFAULT_PRODUCT_KEY = PRODUCT_KEY
const DEFAULT_PRODUCT_NAME = PRODUCT_NAME
const PRODUCT_KEY_CANDIDATES = [DEFAULT_PRODUCT_KEY]
let businessRefreshBlocked = false
const PRODUCT_AUTO_READY_COOKIE = "product_auto_ready"
const ENDPOINT_MISSING_STATUS = new Set([404, 405])
const SERVER_TRANSIENT_STATUS = new Set([502, 503, 504])

const getDefaultProductKey = () => DEFAULT_PRODUCT_KEY
const getDefaultProductName = () => DEFAULT_PRODUCT_NAME
const isTruthy = (value) => ["true", "1", "yes", "y"].includes(String(value || "").trim().toLowerCase())
const isClientSide = () => typeof window !== "undefined"
const isProductAutoReady = () => isClientSide() && isTruthy(getCookie(PRODUCT_AUTO_READY_COOKIE))
const markProductAutoReady = () => {
  if (isClientSide()) setCookie(PRODUCT_AUTO_READY_COOKIE, "true")
}

const authStore = {
  getAccessToken: () => {
    if (typeof window === "undefined") return null
    return (
      getCookie("access_token_auto") ||
      getCookie("access_token") ||
      getCookie("token_auto") ||
      getCookie("token") ||
      null
    )
  },
  getCsrfToken: () => {
    if (typeof window === "undefined") return null
    return (
      getCookie("csrf_token_auto") ||
      getCookie("csrf_token") ||
      null
    )
  },
  getCsrfCandidates: () => {
    if (typeof window === "undefined") return []
    const values = [
      getCookie("csrf_token_auto"),
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
              "x-product-key": productKey,
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

  if (shouldBlockBusinessSession(lastError)) {
    businessRefreshBlocked = true
  }
  throw lastError || new Error("Session expired. Please login again.")
}

const parseErrorMessage = (err, fallback) =>
  err?.response?.data?.error?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback

const getErrorStatus = (err) => Number(err?.response?.status || 0)
const getErrorCode = (err) => String(err?.response?.data?.error?.code || "").toUpperCase()
const getErrorText = (err) => String(parseErrorMessage(err, "")).toLowerCase()
const isEndpointMissingStatus = (status) => ENDPOINT_MISSING_STATUS.has(Number(status || 0))
const isTransientServerStatus = (status) => SERVER_TRANSIENT_STATUS.has(Number(status || 0))

const hasBusinessSessionHint = () =>
  Boolean(
    authStore.getCsrfToken() ||
      getCookie("refresh_token_auto") ||
      getCookie("refresh_token")
  )

const removeEmptyStringFields = (payload = {}) => {
  Object.keys(payload).forEach((key) => {
    if (payload[key] === "") delete payload[key]
  })
  return payload
}

const limitText = (value, max) => String(value || "").trim().slice(0, max)

const getProductKeyCandidates = () => {
  const preferred = String(getDefaultProductKey() || "").trim()
  const candidates = [preferred, ...PRODUCT_KEY_CANDIDATES.map((key) => String(key || "").trim())]
  return [...new Set(candidates.filter(Boolean))]
}

const isRetryableAutocompleteError = (err) => {
  const status = getErrorStatus(err)
  const message = getErrorText(err)

  if ([400, 401, 403].includes(status)) return true
  if (message.includes("unauthorized")) return true
  if (message.includes("invalid input or product key missing")) return true
  if (message.includes("product key")) return true

  return false
}

const isInvalidOrInactiveProductError = (err) => {
  const status = getErrorStatus(err)
  const code = getErrorCode(err)
  const message = getErrorText(err)

  if (code.includes("PRODUCT")) return true
  if (message.includes("invalid or inactive product")) return true
  if (message.includes("product not found")) return true
  return status === 404 && message.includes("product")
}

const isProductContextError = (err) => {
  const status = getErrorStatus(err)
  const message = getErrorText(err)

  if ([401, 403].includes(status)) return true
  if (status === 400 && (message.includes("product key") || message.includes("product"))) return true

  return isInvalidOrInactiveProductError(err)
}

const isCsrfRequiredError = (err) => {
  const status = getErrorStatus(err)
  const code = getErrorCode(err)
  const message = getErrorText(err)

  return (
    status === 403 &&
    (code.includes("CSRF") || message.includes("csrf token is required") || message.includes("csrf"))
  )
}

const shouldBlockBusinessSession = (err) => {
  const status = getErrorStatus(err)
  const code = getErrorCode(err)
  const message = getErrorText(err)

  if ([401, 403].includes(status)) return true
  if (code.includes("CSRF") || code.includes("TOKEN") || code.includes("AUTH")) return true

  return (
    message.includes("csrf token is required") ||
    message.includes("refresh token") ||
    message.includes("invalid refresh token") ||
    message.includes("session expired") ||
    message.includes("unauthorized") ||
    message.includes("login again")
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
      const status = getErrorStatus(err)
      if (!isEndpointMissingStatus(status)) {
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
      if (!isEndpointMissingStatus(getErrorStatus(err))) {
        break
      }
    }
  }

  if (lastError) {
    console.warn("[business.service] ensure product create failed:", lastError?.response?.data || lastError?.message || lastError)
    throw lastError
  }

  throw new Error("Unable to ensure product context")
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
    const hasSessionHint = hasBusinessSessionHint()
    if (!hasSessionHint) {
      throw new Error("Session expired. Please login again.")
    }
    businessRefreshBlocked = false
  }

  try {
    return await requestFn()
  } catch (err) {
    const status = getErrorStatus(err)

    if (status === 401) {
      try {
        // Try bootstrap flow which recovers product auth and tokens
        await bootstrapProductAuth()
      } catch (bootstrapErr) {
        const message = getErrorText(bootstrapErr)

        const isRefreshTokenMissing =
          message.includes("refresh token") ||
          message.includes("invalid refresh token") ||
          message.includes("session expired")

        const shouldBlock =
          isCsrfRequiredError(bootstrapErr) ||
          isRefreshTokenMissing ||
          shouldBlockBusinessSession(bootstrapErr)

        if (shouldBlock) {
          businessRefreshBlocked = true
        }

        throw new Error(
          parseErrorMessage(
            bootstrapErr,
            shouldBlock
              ? "Session expired. Please login again."
              : "Unable to refresh session. Please try again."
          )
        )
      }

      if (authStore.getAccessToken()) {
        businessRefreshBlocked = false
        return requestFn()
      }

      const hasSessionHint = hasBusinessSessionHint()
      businessRefreshBlocked = !hasSessionHint
      throw new Error(
        hasSessionHint
          ? "Unable to refresh session. Please try again."
          : "Session expired. Please login again."
      )
    }

    if (isInvalidOrInactiveProductError(err)) {
      await ensureBusinessProductContext()
      return requestFn()
    }

    throw err
  }
}

/**
 * Business name autocomplete
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
    const status = getErrorStatus(err)
    const message = getErrorText(err)
    if (
      [401, 403].includes(status) ||
      message.includes("session expired") ||
      message.includes("login again") ||
      message.includes("unauthorized")
    ) {
      throw new Error("Session expired. Please login again.")
    }
    if (status === 500 || isTransientServerStatus(status)) {
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
 */
export const registerBusiness = async (data = {}) => {
  const {
    business_name,
    display_name,
    main_category_id,
    business_type,
    seaneb_id,
    primary_number,
    whatsapp_number,
    business_email,
    about_branch,
    address,
    landmark,
    place_id,
    latitude,
    longitude,
    pan,
    pan_number,
    gst,
    gstin,
    product_key,
  } = data

  const finalBusinessName = limitText(business_name ?? "", 30)
  const finalBusinessType = business_type
  const finalPlaceId = String(place_id ?? "").trim()

  if (!finalBusinessName) {
    return Promise.reject(new Error("Business name is required"))
  }

  if (finalBusinessType === undefined || finalBusinessType === null || finalBusinessType === "") {
    return Promise.reject(new Error("Business type is required"))
  }

  if (!finalPlaceId) {
    return Promise.reject(new Error("Business location is required"))
  }

  const effectiveProductKey = String(product_key || getDefaultProductKey()).trim()

  const payload = {
    business_name: finalBusinessName,
    display_name: limitText(display_name || finalBusinessName, 30),
    main_category_id: String(main_category_id ?? "").trim(),
    business_type: Number.isNaN(Number(finalBusinessType)) ? finalBusinessType : Number(finalBusinessType),
    seaneb_id: (seaneb_id || "").trim(),
    primary_number: String(primary_number || "").trim(),
    whatsapp_number: String(whatsapp_number || "").trim(),
    business_email: String(business_email || "").trim(),
    about_branch: (about_branch || "Head office branch").trim(),
    address: (address || "").trim(),
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
  removeEmptyStringFields(payload)

  if (process.env.NODE_ENV !== "production") {
    const safePayload = {
      ...payload,
      pan: payload.pan?.pan_number
        ? { pan_number: `***${String(payload.pan.pan_number).slice(-4)}` }
        : payload.pan,
      gst: payload.gst?.gstin
        ? { gstin: `***${String(payload.gst.gstin).slice(-4)}` }
        : payload.gst,
    }
    console.log("registerBusiness payload:", JSON.stringify(safePayload, null, 2))
  }

  const productKeys = [...new Set([effectiveProductKey].filter(Boolean))]

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
      const status = getErrorStatus(err)
      if (isEndpointMissingStatus(status) || isTransientServerStatus(status)) {
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

/**
 * Verify PAN for a branch
 */
export const verifyPanForBranch = async ({ pan, branch_id }) => {
  if (!pan) {
    return Promise.reject(new Error("PAN is required"))
  }

  if (!branch_id) {
    return Promise.reject(new Error("branch_id is required for PAN verification"))
  }

  try {
    const normalizedPan = String(pan).trim().toUpperCase()
    const makeRequest = () =>
      businessApi.post(
        "/v1/verification/verify-pan",
        {
          pan_number: normalizedPan,
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

