import axios from "axios";
import { getCookie, setCookie, removeCookie } from "./cookieStore";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  withCredentials: true, // required for refresh_token cookie
});

/* ================= MEMORY TOKENS ================= */

let accessToken = null;
let csrfToken = null;
let refreshBlocked = false;

const SESSION_COOKIES = [
  "access_token",
  "access_token_auto",
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

/* ================= LOAD TOKENS ================= */

const loadTokensFromStorage = () => {
  if (typeof window === "undefined") return;

  accessToken =
    getCookie("access_token_auto") ||
    getCookie("access_token") ||
    getCookie("access_token_seaneb") ||
    getCookie("token_auto") ||
    getCookie("token") ||
    null;

  csrfToken =
    getCookie("csrf_token_auto") ||
    getCookie("csrf_token_seaneb") ||
    getCookie("csrf_token") ||
    null;
};

/* ================= SET TOKENS ================= */

export const setSessionTokens = ({ access_token, csrf_token }) => {
  accessToken = access_token || null;
  csrfToken = csrf_token || null;
  refreshBlocked = false;

  if (typeof window !== "undefined") {
    if (access_token) {
      setCookie("access_token", access_token);
      setCookie("access_token_auto", access_token);
    } else {
      removeCookie("access_token");
      removeCookie("access_token_auto");
    }

    if (csrf_token) {
      setCookie("csrf_token", csrf_token);
      setCookie("csrf_token_auto", csrf_token);
    } else {
      removeCookie("csrf_token");
      removeCookie("csrf_token_auto");
    }
  }
};

/* ================= CLEAR SESSION ================= */

export const clearSession = () => {
  accessToken = null;
  csrfToken = null;
  refreshBlocked = false;

  if (typeof window !== "undefined") {
    SESSION_COOKIES.forEach((name) => removeCookie(name));

    // Clear dynamic business profile cookies as well.
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

  // Avoid probing unknown endpoints that generate 404 noise.
  // Configure `NEXT_PUBLIC_LOGOUT_ENDPOINTS` if backend supports explicit logout.
  if (!configuredEndpoints.length) return;

  const csrfCandidates = [
    getCookie("csrf_token_auto"),
    getCookie("csrf_token"),
    getCookie("csrf_token_seaneb"),
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  for (const endpoint of configuredEndpoints) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (csrfCandidates[0]) headers["x-csrf-token"] = csrfCandidates[0];

      await axios.post(
        endpoint,
        { product_key: "auto" },
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

api.interceptors.request.use((config) => {
  // Always reload tokens before every request (don't rely on cached values)
  loadTokensFromStorage();

  const isPublicRoute =
    config.url?.includes("/otp") ||
    config.url?.includes("/auth/email/send-otp") ||
    config.url?.includes("/auth/email/verify-otp") ||
    config.url?.includes("/auth/login") ||
    config.url?.includes("/auth/register");

  if (accessToken && !isPublicRoute) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // ❌ REMOVED THIS LINE (caused CORS error)
  // config.headers["x-product-key"] = "seaneb";

  return config;
});

/* ================= RESPONSE INTERCEPTOR ================= */

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    if (error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (refreshBlocked) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      // Already retried once after refresh. Keep session and let caller handle 401.
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    loadTokensFromStorage();

    if (!csrfToken) {
      // Missing CSRF for refresh flow; keep user on current page and surface 401.
      return Promise.reject(error);
    }

    try {
      console.log("🔄 Attempting token refresh...");

      const refreshRes = await axios.post(
        "/api/v1/auth/refresh",
        { product_key: "auto" }, // ✅ send in body instead
        {
          withCredentials: true,
          headers: {
            "x-csrf-token": csrfToken,
            "Content-Type": "application/json",
          },
        }
      );

      const { access_token, csrf_token } = refreshRes.data;

      if (!access_token) {
        throw new Error("No access token returned from refresh");
      }

      setSessionTokens({ access_token, csrf_token });

      originalRequest.headers.Authorization = `Bearer ${access_token}`;

      console.log("✅ Refresh successful. Retrying request.");

      return api(originalRequest);
    } catch (refreshError) {
      console.log("❌ Refresh failed. Session expired.");
      refreshBlocked = true;

      return Promise.reject(refreshError);
    }
  }
);

export default api;





