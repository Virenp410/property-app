import { load } from "@cashfreepayments/cashfree-js";

const normalizeMode = (value) => {
  const mode = String(value || "")
    .trim()
    .toLowerCase();
  return mode === "production" ? "production" : "sandbox";
};

const cashfreePromisesByMode = new Map();

export const getCashfreeClient = async ({ mode } = {}) => {
  const resolvedMode = normalizeMode(mode);

  if (typeof window === "undefined") {
    return null;
  }

  const cached = cashfreePromisesByMode.get(resolvedMode);
  if (cached) return cached;

  const promise = load({ mode: resolvedMode });
  cashfreePromisesByMode.set(resolvedMode, promise);
  return promise;
};

