"use client";

const DEFAULT_DAYS = 7;
const LEGACY_STORAGE_PREFIX = "__app_state_cookie__:";
const ALLOWED_COOKIE_NAMES = new Set([
  "csrf_token",
  "csrf_token_auto",
  "refresh_token",
  "refresh_token_auto",
]);
const MEMORY_STATE = new Map();
const MEMORY_STATE_EXPIRY = new Map();

const encode = (value) => encodeURIComponent(String(value ?? ""));
const decode = (value) => {
  try {
    return decodeURIComponent(String(value ?? ""));
  } catch {
    return String(value ?? "");
  }
};

const isAllowedCookieName = (name) => ALLOWED_COOKIE_NAMES.has(String(name || "").trim());

const setMemoryState = (name, value, days = DEFAULT_DAYS) => {
  const ttlDays = Number(days);
  const expiresAt = Number.isFinite(ttlDays)
    ? Date.now() + ttlDays * 24 * 60 * 60 * 1000
    : Date.now() + DEFAULT_DAYS * 24 * 60 * 60 * 1000;

  MEMORY_STATE.set(name, String(value ?? ""));
  MEMORY_STATE_EXPIRY.set(name, expiresAt);
};

const getMemoryState = (name) => {
  if (!MEMORY_STATE.has(name)) return null;
  const expiresAt = Number(MEMORY_STATE_EXPIRY.get(name) || 0);
  if (expiresAt && Date.now() > expiresAt) {
    MEMORY_STATE.delete(name);
    MEMORY_STATE_EXPIRY.delete(name);
    return null;
  }
  return MEMORY_STATE.get(name);
};

const clearMemoryState = (name) => {
  MEMORY_STATE.delete(name);
  MEMORY_STATE_EXPIRY.delete(name);
};

const removeBrowserCookie = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
};

const removeLegacyStorageKey = (name) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${LEGACY_STORAGE_PREFIX}${name}`);
  } catch {
    // ignore storage access failures
  }
};

const parseLegacyStorageRecord = (raw) => {
  if (raw == null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "value" in parsed) {
      const expiresAt = Number(parsed.expiresAt || 0);
      if (expiresAt && Date.now() > expiresAt) return null;
      return {
        value: String(parsed.value ?? ""),
        expiresAt:
          expiresAt || Date.now() + DEFAULT_DAYS * 24 * 60 * 60 * 1000,
      };
    }
  } catch {
    // fall through and treat as plain string
  }

  return {
    value: String(raw),
    expiresAt: Date.now() + DEFAULT_DAYS * 24 * 60 * 60 * 1000,
  };
};

const migrateLegacyStorageToMemory = () => {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(window.localStorage || {});
    for (const key of keys) {
      if (!key.startsWith(LEGACY_STORAGE_PREFIX)) continue;
      const stateName = key.slice(LEGACY_STORAGE_PREFIX.length);
      const raw = window.localStorage.getItem(key);
      const record = parseLegacyStorageRecord(raw);
      if (record && !MEMORY_STATE.has(stateName)) {
        MEMORY_STATE.set(stateName, record.value);
        MEMORY_STATE_EXPIRY.set(stateName, record.expiresAt);
      }
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore storage access failures
  }
};

const cleanupNonTokenCookies = () => {
  if (typeof document === "undefined") return;
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    const eqIndex = part.indexOf("=");
    const name = (eqIndex > -1 ? part.slice(0, eqIndex) : part).trim();
    const rawValue = eqIndex > -1 ? part.slice(eqIndex + 1) : "";
    if (!name) continue;
    if (!isAllowedCookieName(name)) {
      setMemoryState(name, decode(rawValue), DEFAULT_DAYS);
      removeBrowserCookie(name);
    }
  }
};

if (typeof window !== "undefined") {
  migrateLegacyStorageToMemory();
  cleanupNonTokenCookies();
}

export const getCookie = (name) => {
  const safeName = String(name || "").trim();
  if (!safeName) return null;

  if (typeof document !== "undefined") {
    const key = `${safeName}=`;
    const parts = document.cookie ? document.cookie.split("; ") : [];
    for (const part of parts) {
      if (part.startsWith(key)) {
        return decode(part.slice(key.length));
      }
    }
  }
  return getMemoryState(safeName);
};

export const setCookie = (name, value, options = {}) => {
  const safeName = String(name || "").trim();
  if (!safeName) return;

  if (isAllowedCookieName(safeName)) {
    if (typeof document === "undefined") return;
    const days = Number(options.days ?? DEFAULT_DAYS);
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${safeName}=${encode(value)}; Expires=${expires}; Path=/; SameSite=Lax`;
    clearMemoryState(safeName);
    removeLegacyStorageKey(safeName);
    return;
  }

  setMemoryState(safeName, value, options.days);
  removeLegacyStorageKey(safeName);
  removeBrowserCookie(safeName);
};

export const removeCookie = (name) => {
  const safeName = String(name || "").trim();
  if (!safeName) return;

  removeBrowserCookie(safeName);
  clearMemoryState(safeName);
  removeLegacyStorageKey(safeName);
};

export const getJsonCookie = (name, fallback = null) => {
  const raw = getCookie(name);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const setJsonCookie = (name, value, options = {}) => {
  setCookie(name, JSON.stringify(value ?? null), options);
};
