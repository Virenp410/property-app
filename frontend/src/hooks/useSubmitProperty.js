"use client";

import { useCallback, useState } from "react";
import { buildClientAuthHeaders } from "@/lib/auth/clientAuth";

const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

const appendPrimitiveFields = (formData, fields) => {
  if (!fields || typeof fields !== "object") return;

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;

    const valueType = typeof value;
    const isPrimitive =
      valueType === "string" || valueType === "number" || valueType === "boolean";
    if (!isPrimitive) continue;

    formData.append(key, String(value));
  }
};

const safeJsonStringify = (value, fallback) => {
  try {
    return JSON.stringify(value ?? fallback);
  } catch {
    return JSON.stringify(fallback);
  }
};

const normalizeAmenities = (amenities) => {
  const list = Array.isArray(amenities) ? amenities : [];
  const seen = new Set();
  const normalized = [];

  for (const item of list) {
    const value = String(item || "")
      .trim()
      .toLowerCase();
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
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

/**
 * Submits a property payload to:
 * POST `${process.env.NEXT_PUBLIC_DEV_URL}/api/v1/property/property`
 *
 * Critical Multer rules:
 * - Uses FormData (do not set Content-Type manually)
 * - Stringifies nested JSON fields: location, transaction_details, amenities
 * - Appends images array under `images` key; appends optional single `image`
 */
export default function useSubmitProperty({ toast } = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitProperty = useCallback(
    async ({
      // Nested fields (MUST be stringified for Multer)
      location,
      transaction_details,
      amenities,

      // Files
      images,
      image,

      // Flat fields (strings/numbers/booleans)
      ...flatFields
    } = {}) => {
      if (isSubmitting) return null;

      const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_DEV_URL);
      if (!baseUrl) {
        const message =
          "Missing NEXT_PUBLIC_DEV_URL. Set it in frontend/.env and restart the dev server.";
        toast?.({ type: "error", message });
        throw new Error(message);
      }

      const headers = buildClientAuthHeaders();

      const endpoint = `${baseUrl}/api/v1/property/property`;

      try {
        setIsSubmitting(true);

        const formData = new FormData();

        // Flat fields: append only primitives (string/number/boolean)
        appendPrimitiveFields(formData, flatFields);

        // Nested JSON: stringify before appending
        formData.append("location", safeJsonStringify(location, {}));
        formData.append(
          "transaction_details",
          safeJsonStringify(transaction_details, {})
        );
        formData.append(
          "amenities",
          safeJsonStringify(normalizeAmenities(amenities), [])
        );

        // Files
        const imageList = Array.isArray(images) ? images : [];
        imageList.filter(Boolean).forEach((file) => formData.append("images", file));
        if (image) formData.append("image", image);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            ...headers,
          },
          body: formData,
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

        toast?.({ type: "success", message: "Property submitted successfully." });
        return payload;
      } catch (error) {
        const message = String(error?.message || "Failed to submit property");
        toast?.({ type: "error", message });
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, toast]
  );

  return { isSubmitting, submitProperty };
}
