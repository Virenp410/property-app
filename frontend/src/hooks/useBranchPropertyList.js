"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildClientAuthHeaders } from "@/lib/auth/clientAuth";

const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

const extractItems = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const root = payload?.data ?? payload;
  if (Array.isArray(root)) return root;

  const candidates = [
    root?.properties,
    root?.rows,
    root?.items,
    root?.list,
    root?.result,
    root?.data,
    payload?.properties,
    payload?.rows,
    payload?.items,
    payload?.list,
    payload?.result,
    payload?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

const extractTotal = (payload) => {
  const root = payload?.data ?? payload;
  const value =
    root?.total ??
    root?.totalCount ??
    root?.count ??
    root?.pagination?.total ??
    root?.meta?.total ??
    payload?.total ??
    payload?.count;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const parseResponsePayload = async (response) => {
  const contentType = String(response?.headers?.get?.("content-type") || "");
  const isJson = contentType.includes("application/json");
  if (!isJson) {
    const text = await response.text().catch(() => "");
    return text;
  }
  return response.json().catch(() => null);
};

export default function useBranchPropertyList({ status, page = 1, limit = 10 } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const safeStatus = String(status || "").trim().toLowerCase();
  const safePage = Math.max(1, Number(page || 1));
  const safeLimit = Math.max(1, Math.min(50, Number(limit || 10)));

  const endpoint = useMemo(() => {
    const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_DEV_URL);
    if (!baseUrl) return "";
    if (!safeStatus) return "";
    const params = new URLSearchParams();
    params.set("page", String(safePage));
    params.set("limit", String(safeLimit));
    params.set("_t", String(Date.now()));
    return `${baseUrl}/api/v1/property/property/branch/${encodeURIComponent(
      safeStatus
    )}?${params.toString()}`;
  }, [safeStatus, safePage, safeLimit]);

  const fetchNow = useCallback(async () => {
    if (!endpoint) return;

    try {
      setLoading(true);
      setError("");

      const headers = buildClientAuthHeaders();
      const response = await fetch(endpoint, {
        method: "GET",
        headers,
      });

      const payload = await parseResponsePayload(response);
      if (!response.ok) {
        const message =
          String(
            payload?.message ||
              payload?.error?.message ||
              payload?.error ||
              payload ||
              ""
          ).trim() || `Request failed [HTTP ${response.status}]`;
        throw new Error(message);
      }

      setItems(extractItems(payload));
      setTotal(extractTotal(payload));
    } catch (err) {
      setItems([]);
      setTotal(null);
      setError(String(err?.message || "Failed to fetch properties"));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchNow();
  }, [fetchNow]);

  return { items, total, loading, error, refresh: fetchNow };
}

