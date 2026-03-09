import axios from "axios";
import { getCookie, setCookie, removeCookie } from "./cookieStore";
import { PRODUCT_KEY } from "./productKey";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  withCredentials: true,
});

/* ================= MEMORY TOKENS ================= */

let accessToken = null;
let csrfToken = null;
let refreshBlocked = false;
let refreshPromise = null;

const SESSION_COOKIES = [
  "access_token",
  "access_token_auto",
  "token",
  "token_auto",
  "refresh_token",
  "refresh_token_auto",
  "csrf_token",
  "csrf_token_auto",
  "show_profile_nav",
  "user_display_name",
  "profile_completed",
  "dashboard_mode",
  "business_registered",
  "business_register",
  "business_id",
  "branch_id",
  "business_name",
  "has_business_for_mobile",
  "business_owner_mobile",
  "verified_business_email",
  "business_email_verified",
  "business_mobile_verified",
  "verified_mobile",
  "verified_email",
  "user_email",
  "otp_context",
  "reg_form_draft",
  "business_reg_draft",
  "user_skipped_biz",
  "mobile_verified",
  "email_verified",
];

const PUBLIC_ROUTE_PATTERNS = [
  "/v1/otp/",
  "/auth/email/send-otp",
  "/auth/email/verify-otp",
  "/v1/user/signup",
  "/v1/seanebid/check",
  "/auth/login",
  "/auth/register",
];

const REFRESH_ROUTE_PATTERNS = ["/v1/auth/refresh", "/auth/refresh"];

/* ================= LOAD TOKENS ================= */

const loadTokensFromStorage = () => {
  if (typeof window === "undefined") return;

  accessToken =
    getCookie("access_token_auto") ||
    getCookie("access_token") ||
    getCookie("token_auto") ||
    getCookie("token") ||
    null;

  csrfToken =
    getCookie("csrf_token_auto") ||
    getCookie("csrf_token") ||
    null;
};

const isRefreshAuthFailure = (error) => {
  const status = Number(error?.response?.status || 0);
  return status === 401 || status === 403;
};

const refreshAccessToken = async () => {
  loadTokensFromStorage();

  if (!csrfToken) {
    throw new Error("CSRF token is required");
  }

  const refreshRes = await axios.post(
    "/api/v1/auth/refresh",
    { product_key: PRODUCT_KEY },
    {
      withCredentials: true,
      headers: {
        "x-csrf-token": csrfToken,
        "x-product-key": PRODUCT_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  const { access_token, csrf_token } = refreshRes?.data || {};
  if (!access_token) {
    throw new Error("No access token returned from refresh");
  }

  setSessionTokens({ access_token, csrf_token });
  return access_token;
};

const getRefreshPromise = () => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const isMatchingRoute = (url, patterns) => {
  const route = String(url || "");
  if (!route) return false;
  return patterns.some((pattern) => route.includes(pattern));
};

const isRefreshRoute = (url) => isMatchingRoute(url, REFRESH_ROUTE_PATTERNS);

const isPublicRoute = (url) => isMatchingRoute(url, PUBLIC_ROUTE_PATTERNS) || isRefreshRoute(url);

/* ================= SET TOKENS ================= */

export const setSessionTokens = ({ access_token, csrf_token }) => {
  accessToken = access_token || null;
  csrfToken = csrf_token || null;
  refreshBlocked = false;

  if (typeof window !== "undefined") {
    if (access_token) {
      setCookie("access_token", access_token);
    } else {
      removeCookie("access_token");
      removeCookie("access_token_auto");
    }

    if (csrf_token) {
      setCookie("csrf_token_auto", csrf_token);
      removeCookie("csrf_token");
    } else {
      removeCookie("csrf_token_auto");
      removeCookie("csrf_token");
    }
  }
};

/* ================= CLEAR SESSION ================= */

export const clearSession = () => {
  accessToken = null;
  csrfToken = null;
  refreshBlocked = false;
  refreshPromise = null;

  if (typeof window !== "undefined") {
    SESSION_COOKIES.forEach((name) => removeCookie(name));

    const parts = document.cookie ? document.cookie.split("; ") : [];
    parts.forEach((part) => {
      const eqIndex = part.indexOf("=");
      const cookieName = eqIndex > -1 ? part.slice(0, eqIndex) : part;
      if (cookieName.startsWith("business_profile_")) {
        removeCookie(cookieName);
      }
    });

    try {
      window.localStorage.removeItem("access_token");
      window.localStorage.removeItem("user_display_name");
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith("business_profile_")) {
          window.localStorage.removeItem(key);
        }
      });
    } catch {
      // ignore storage access failures
    }
  }
};

export const clearServerSession = async () => {
  if (typeof window === "undefined") return;

  const configuredEndpoints = String(process.env.NEXT_PUBLIC_LOGOUT_ENDPOINTS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!configuredEndpoints.length) return;

  const csrfCandidates = [getCookie("csrf_token_auto"), getCookie("csrf_token")]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  for (const endpoint of configuredEndpoints) {
    try {
      const headers = { "Content-Type": "application/json", "x-product-key": PRODUCT_KEY };
      if (csrfCandidates[0]) headers["x-csrf-token"] = csrfCandidates[0];

      await axios.post(
        endpoint,
        { product_key: PRODUCT_KEY },
        {
          withCredentials: true,
          headers,
        }
      );
      return;
    } catch {
      // best-effort; continue trying alternate endpoints
    }
  }
};

/* ================= REQUEST INTERCEPTOR ================= */

api.interceptors.request.use(async (config) => {
  loadTokensFromStorage();

  if (isPublicRoute(config.url)) {
    return config;
  }

  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  }

  if (refreshBlocked) {
    return config;
  }

  try {
    const newAccessToken = await getRefreshPromise();
    if (newAccessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${newAccessToken}`;
    }
  } catch (refreshError) {
    if (isRefreshAuthFailure(refreshError)) {
      refreshBlocked = true;
    }
  }

  return config;
});

/* ================= RESPONSE INTERCEPTOR ================= */

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = Number(error?.response?.status || 0);

    if (!error.response) {
      return Promise.reject(error);
    }

    if (![401, 403].includes(status)) {
      return Promise.reject(error);
    }

    if (isPublicRoute(originalRequest.url) || isRefreshRoute(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (refreshBlocked) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await getRefreshPromise();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      if (isRefreshAuthFailure(refreshError)) {
        refreshBlocked = true;
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;

