import axios from "axios";
import {
  ACCESS_TOKEN_KEYS,
  REFRESH_ENDPOINT,
  getStableProductKey,
  pickTokenValue,
  readFirstCookie,
} from "./shared";

const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true,
});

let accessToken = null;
let refreshPromise = null;

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
const isMutatingMethod = (method) =>
  ["post", "put", "patch", "delete"].includes(String(method || "").toLowerCase());

export const setAccessToken = (token) => {
  const nextValue = String(token || "").trim();
  accessToken = nextValue || null;
};

export const clearAccessToken = () => {
  accessToken = null;
  refreshPromise = null;
};

const applyAuthPayload = (payload) => {
  const token = pickTokenValue(payload, ACCESS_TOKEN_KEYS);
  if (token) setAccessToken(token);
  return token;
};

export const refreshAccessToken = async () => {
  const productKey = getStableProductKey();
  const csrfToken = readFirstCookie(["csrf_token_auto", "csrf_token", "csrf"]);
  const headers = { "Content-Type": "application/json" };

  if (productKey) {
    headers["x-product-key"] = productKey;
  }

  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  const response = await axios.post(
    `/api${REFRESH_ENDPOINT}`,
    { product_key: productKey },
    {
      withCredentials: true,
      headers,
    }
  );

  const token = applyAuthPayload(response?.data || {});
  if (!token) {
    throw new Error("No access token returned from refresh");
  }

  return token;
};

const getRefreshPromise = () => {
  // Refresh dedupe: multiple requests reuse one in-flight refresh call.
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

apiClient.interceptors.request.use(async (config) => {
  const url = String(config?.url || "");
  config.headers = config.headers || {};

  if (isMutatingMethod(config?.method)) {
    const csrfToken = readFirstCookie(["csrf_token_auto", "csrf_token", "csrf"]);
    if (csrfToken && !config.headers["x-csrf-token"]) {
      config.headers["x-csrf-token"] = csrfToken;
    }
  }

  if (isPublicRoute(url) || isRefreshRoute(url)) return config;

  const productKey = getStableProductKey();
  if (productKey) {
    config.headers["x-product-key"] = productKey;
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  }

  // Refresh flow: attempt silent refresh only when a refresh cookie exists.
  const refreshCookie = readFirstCookie([
    "refresh_token_auto",
    "refresh_token",
    "refresh",
  ]);
  if (!refreshCookie) return config;

  try {
    const token = await getRefreshPromise();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    clearAccessToken();
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
      const token = await getRefreshPromise();
      originalRequest.headers = originalRequest.headers || {};
      const productKey = getStableProductKey();
      if (productKey && !originalRequest.headers["x-product-key"]) {
        originalRequest.headers["x-product-key"] = productKey;
      }
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
