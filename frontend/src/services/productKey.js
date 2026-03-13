const FALLBACK_PRODUCT_KEY = "auto";

export const PRODUCT_KEY =
  String(process.env.NEXT_PUBLIC_PRODUCT_KEY || FALLBACK_PRODUCT_KEY).trim() ||
  FALLBACK_PRODUCT_KEY;

export const PRODUCT_NAME =
  PRODUCT_KEY.charAt(0).toUpperCase() + PRODUCT_KEY.slice(1).toLowerCase();
