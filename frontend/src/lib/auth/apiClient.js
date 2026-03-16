import axios from "axios";
import { getActiveProductKey } from "@/lib/productKey";
import { isSsoLockActive } from "./ssoLock";

const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true,
});

const REFRESH_ENDPOINT = "/v1/auth/refresh";
const ACCESS_TOKEN_KEYS = ["access_token", "accessToken", "token"];

const getStableProductKey = () =>
  String(getActiveProductKey() || "").trim().toLowerCase();

const pickTokenValue = (payload, keys) => {
  const data = payload?.data || {};
  for (const key of keys) {
    const value = String(data[key] || payload?.[key] || "").trim();
    if (value) return value;
  }
  return "";
};

const readBrowserCookie = (name) => {
  if (typeof document === "undefined") return "";
  const safeName = String(name || "").trim();
  if (!safeName) return "";

  const key = `${safeName}=`;
  const parts = document.cookie ? document.cookie.split(/;\s*/) : [];
  for (const part of parts) {
    if (!part.startsWith(key)) continue;
    const raw = part.slice(key.length);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  return "";
};

const readFirstCookie = (names) => {
  for (const name of names) {
    const value = readBrowserCookie(name);
    if (value) return value;
  }
  return "";
};

let accessToken = null;
let refreshPromise = null;

const pickCsrfFromResponse = (response) => {
  const headers = response?.headers || {};
  const readHeader = (name) => {
    if (!headers) return "";
    if (typeof headers.get === "function") {
      return String(headers.get(name) || "").trim();
    }
    return String(headers[name] || headers[name?.toLowerCase?.()] || "").trim();
  };
  const headerToken = readHeader("x-csrf-token") || readHeader("csrf-token");
  if (headerToken) return headerToken;
  return pickTokenValue(response?.data || {}, ["csrf_token", "csrfToken"]);
};

const PUBLIC_ROUTE_HINTS = [
  "/v1/otp/",
  "/auth/email/send-otp",
  "/auth/email/verify-otp",
  "/v1/user/signup",
  "/v1/seanebid/check",
  "/auth/login",
  "/auth/register",
];
const MAX_AUTH_RETRY = 1;

const isPublicRoute = (url) =>
  PUBLIC_ROUTE_HINTS.some((hint) => String(url || "").includes(hint));

const isRefreshRoute = (url) => String(url || "").includes(REFRESH_ENDPOINT);
export const setAccessToken = (token) => {
  const nextValue = String(token || "").trim();
  accessToken = nextValue || null;
};

export const clearAccessToken = () => {
  accessToken = null;
};

const applyAuthPayload = (payload) => {
  const token = pickTokenValue(payload, ACCESS_TOKEN_KEYS);
  if (token) setAccessToken(token);
  return token;
};

const decodeJwtPayload = (token) => {
  const parts = String(token || "").trim().split(".");
  if (parts.length !== 3) return null;
  const payload = parts[1];
  if (!payload) return null;
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = `${base64}${"=".repeat(padLength)}`;
  try {
    const jsonText = atob(padded);
    const parsed = JSON.parse(jsonText);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const pickRefreshProductKey = () => {
  const refreshToken = readFirstCookie(["refresh_token_auto", "refresh_token"]);
  if (!refreshToken) return "";
  const payload = decodeJwtPayload(refreshToken);
  const productId = String(payload?.product_id || payload?.productId || "").trim();
  return productId;
};

const refreshAccessTokenInternal = async () => {
  if (isSsoLockActive()) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  if (isSsoLockActive()) {
    const lockError = new Error("SSO exchange in progress");
    lockError.code = "SSO_LOCK_ACTIVE";
    lockError.isSsoLock = true;
    throw lockError;
  }

  const productKey = getStableProductKey();
  const refreshProductKey = pickRefreshProductKey();
  const csrfToken = readFirstCookie([
    productKey ? `csrf_token_${productKey}` : "",
    "csrf_token_auto",
    "csrf_token",
    "csrf",
  ]);
  const headers = { "Content-Type": "application/json" };

  const primaryProductKey = productKey || refreshProductKey;
  if (primaryProductKey) {
    headers["x-product-key"] = primaryProductKey;
  }

  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  const fetchRefresh = async (overrideProductKey = "") => {
    const bodyProductKey = overrideProductKey || primaryProductKey || "";
    const requestHeaders = { ...headers };
    if (overrideProductKey) {
      requestHeaders["x-product-key"] = overrideProductKey;
    }

    return fetch(`/api${REFRESH_ENDPOINT}`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        ...(bodyProductKey ? { product_key: bodyProductKey } : {}),
      }),
      credentials: "include",
      keepalive: true,
    });
  };

  let response;
  try {
    response = await fetchRefresh();
  } catch (err) {
    const networkError = new Error("Refresh request failed");
    networkError.cause = err;
    networkError.isNetworkError = true;
    throw networkError;
  }

  let responseData = {};
  const contentType = String(response.headers?.get?.("content-type") || "");
  try {
    responseData = contentType.includes("application/json")
      ? await response.json()
      : {};
  } catch {
    responseData = {};
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      refreshProductKey &&
      refreshProductKey !== primaryProductKey
    ) {
      response = await fetchRefresh(refreshProductKey);
      responseData = {};
      const retryType = String(response.headers?.get?.("content-type") || "");
      try {
        responseData = retryType.includes("application/json")
          ? await response.json()
          : {};
      } catch {
        responseData = {};
      }
    }

    if (!response.ok) {
      const refreshError = new Error(`Refresh failed with status ${response.status}`);
      refreshError.status = response.status;
      refreshError.response = { status: response.status, data: responseData };
      throw refreshError;
    }
  }

  const token = applyAuthPayload(responseData || {});
  if (!token) {
    throw new Error("No access token returned from refresh");
  }

  const csrfHeaderToken = pickCsrfFromResponse({ headers: response.headers });
  const csrfBodyToken = pickTokenValue(responseData || {}, ["csrf_token", "csrfToken"]);
  return { token, csrf: csrfHeaderToken || csrfBodyToken || "" };
};

export const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessTokenInternal().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

const getErrorStatus = (err) =>
  Number(err?.response?.status || err?.status || 0);

const handleRefreshError = (err) => {
  const status = getErrorStatus(err);

  if (status === 401 || status === 403) {
    clearAccessToken();
    return;
  }
};

apiClient.interceptors.request.use(async (config) => {
  const url = String(config?.url || "");
  config.headers = config.headers || {};

  const productKey = getStableProductKey();

  const csrfToken = readFirstCookie([
    productKey ? `csrf_token_${productKey}` : "",
    "csrf_token_auto",
    "csrf_token",
    "csrf",
  ]);
  if (csrfToken && !config.headers["x-csrf-token"]) {
    config.headers["x-csrf-token"] = csrfToken;
  }

  if (isPublicRoute(url) || isRefreshRoute(url)) return config;

  if (productKey) {
    config.headers["x-product-key"] = productKey;
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  }

  try {
    const { token, csrf } = await refreshAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (csrf && !config.headers["x-csrf-token"]) {
      config.headers["x-csrf-token"] = csrf;
    }
  } catch (err) {
    handleRefreshError(err);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = Number(error?.response?.status || 0);
    const url = String(originalRequest?.url || "");

    if (status !== 401) {
      return Promise.reject(error);
    }

    const retryCount = Number(originalRequest._authRetryCount || 0);
    if (isPublicRoute(url) || isRefreshRoute(url) || retryCount >= MAX_AUTH_RETRY) {
      return Promise.reject(error);
    }

    originalRequest._authRetryCount = retryCount + 1;

    try {
      const { token, csrf } = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers || {};
      const productKey = getStableProductKey();
      if (productKey && !originalRequest.headers["x-product-key"]) {
        originalRequest.headers["x-product-key"] = productKey;
      }
      originalRequest.headers.Authorization = `Bearer ${token}`;
      if (csrf) originalRequest.headers["x-csrf-token"] = csrf;
      return apiClient(originalRequest);
    } catch (refreshError) {
      handleRefreshError(refreshError);
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
