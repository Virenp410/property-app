"use client";

import { readBrowserCookie } from "@/lib/auth/shared";

const TOKEN_COOKIE_NAMES = new Set([
  "csrf_token",
  "csrf_token_auto",
  "refresh_token",
  "refresh_token_auto",
]);

const transientState = new Map();

const normalizeName = (name) => String(name || "").trim();

const removeBrowserCookie = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
};

export const getCookie = (name) => {
  const key = normalizeName(name);
  if (!key) return null;

  if (TOKEN_COOKIE_NAMES.has(key)) {
    const cookieValue = String(readBrowserCookie(key) || "").trim();
    return cookieValue || null;
  }

  if (transientState.has(key)) {
    return String(transientState.get(key));
  }

  const browserValue = String(readBrowserCookie(key) || "").trim();
  return browserValue || null;
};

export const setCookie = (name, value) => {
  const key = normalizeName(name);
  if (!key) return;

  // Session tokens are backend-managed only.
  if (TOKEN_COOKIE_NAMES.has(key)) return;

  transientState.set(key, String(value ?? ""));
  removeBrowserCookie(key);
};

export const removeCookie = (name) => {
  const key = normalizeName(name);
  if (!key) return;

  transientState.delete(key);
  removeBrowserCookie(key);
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

export const setJsonCookie = (name, value) => {
  setCookie(name, JSON.stringify(value ?? null));
};
