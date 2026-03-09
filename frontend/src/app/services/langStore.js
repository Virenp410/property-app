"use client";

import { getCookie, setCookie } from "./cookieStore";

export const DEFAULT_LANG = "en";
const LANG_KEY = "app_lang";
const SUPPORTED_LANGS = new Set(["en", "hi", "gu"]);
const listeners = new Set();

export const normalizeLang = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "guj") return "gu";
  return SUPPORTED_LANGS.has(raw) ? raw : "";
};

export const getStoredLang = () => {
  if (typeof window === "undefined") return DEFAULT_LANG;

  const cookieLang = normalizeLang(getCookie(LANG_KEY));
  if (cookieLang) return cookieLang;

  try {
    const localStorageLang = normalizeLang(window.localStorage.getItem(LANG_KEY));
    if (localStorageLang) return localStorageLang;
  } catch {
    // ignore storage access failures
  }

  return DEFAULT_LANG;
};

export const setStoredLang = (value) => {
  const normalized = normalizeLang(value) || DEFAULT_LANG;
  const previous = getStoredLang();
  setCookie(LANG_KEY, normalized, { days: 365 });

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LANG_KEY, normalized);
    } catch {
      // ignore storage access failures
    }
  }

  if (previous !== normalized) {
    for (const notify of listeners) {
      notify();
    }
  }

  return normalized;
};

export const subscribeLang = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getServerLangSnapshot = () => DEFAULT_LANG;
