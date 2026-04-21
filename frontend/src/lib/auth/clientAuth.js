"use client";

import { PRODUCT_KEY } from "@/lib/productKey";
import { getAccessToken as getInMemoryAccessToken } from "@/lib/auth/apiClient";

const ACCESS_TOKEN_KEYS = ["access_token", "accessToken", "token"];

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

const readFirstStorageValue = (keys) => {
  if (typeof window === "undefined") return "";
  for (const key of keys) {
    try {
      const value = String(window.localStorage?.getItem?.(key) || "").trim();
      if (value) return value;
    } catch {
      // ignore storage access errors
    }
  }
  return "";
};

const readFirstCookieValue = (keys) => {
  for (const key of keys) {
    const value = String(readBrowserCookie(key) || "").trim();
    if (value) return value;
  }
  return "";
};

export const getClientAccessToken = () => {
  const inMemory = String(getInMemoryAccessToken?.() || "").trim();
  if (inMemory) return inMemory;

  const fromStorage = readFirstStorageValue(ACCESS_TOKEN_KEYS);
  if (fromStorage) return fromStorage;

  return readFirstCookieValue(ACCESS_TOKEN_KEYS);
};

export const getClientProductKey = () => {
  const fromStorage = readFirstStorageValue([
    "x-product-key",
    "productKey",
    "product_key",
  ]);
  if (fromStorage) return fromStorage;

  const fromCookie = readFirstCookieValue([
    "x-product-key",
    "productKey",
    "product_key",
  ]);
  if (fromCookie) return fromCookie;

  return String(PRODUCT_KEY || process.env.NEXT_PUBLIC_PRODUCT_KEY || "").trim();
};

export const buildClientAuthHeaders = () => {
  const token = getClientAccessToken();
  if (!token) throw new Error("Missing auth token. Please login again and retry.");

  const productKey = getClientProductKey();
  if (!productKey) {
    throw new Error("Missing x-product-key. Set NEXT_PUBLIC_PRODUCT_KEY and retry.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "x-product-key": productKey,
  };
};

