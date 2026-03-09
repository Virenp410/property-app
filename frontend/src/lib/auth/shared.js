import { getActiveProductKey } from "@/lib/productKey";

export const REFRESH_ENDPOINT = "/v1/auth/refresh";
export const ACCESS_TOKEN_KEYS = ["access_token", "accessToken", "token"];

export const getStableProductKey = () =>
  String(getActiveProductKey() || "").trim().toLowerCase();

export const pickTokenValue = (payload, keys) => {
  const data = payload?.data || {};
  for (const key of keys) {
    const value = String(data[key] || payload?.[key] || "").trim();
    if (value) return value;
  }
  return "";
};

export const readBrowserCookie = (name) => {
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

export const readFirstCookie = (names) => {
  for (const name of names) {
    const value = readBrowserCookie(name);
    if (value) return value;
  }
  return "";
};
