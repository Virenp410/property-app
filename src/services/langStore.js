"use client";

export const DEFAULT_LANG = "en";
const SUPPORTED_LANGS = new Set(["en", "hi", "gu"]);
const listeners = new Set();
let currentLang = DEFAULT_LANG;

export const normalizeLang = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "guj") return "gu";
  return SUPPORTED_LANGS.has(raw) ? raw : "";
};

export const getStoredLang = () => {
  return currentLang;
};

export const setStoredLang = (value) => {
  const normalized = normalizeLang(value) || DEFAULT_LANG;
  const previous = currentLang;
  currentLang = normalized;

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
