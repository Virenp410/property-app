"use client";

const DEFAULT_DAYS = 7;

const encode = (value) => encodeURIComponent(String(value ?? ""));
const decode = (value) => decodeURIComponent(String(value ?? ""));

export const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const key = `${name}=`;
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    if (part.startsWith(key)) {
      return decode(part.slice(key.length));
    }
  }
  return null;
};

export const setCookie = (name, value, options = {}) => {
  if (typeof document === "undefined") return;
  const days = Number(options.days ?? DEFAULT_DAYS);
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encode(value)}; Expires=${expires}; Path=/; SameSite=Lax`;
};

export const removeCookie = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
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
