export const PRODUCT_KEY = String(process.env.NEXT_PUBLIC_PRODUCT_KEY || "").trim();

export const PRODUCT_NAME =
  PRODUCT_KEY.charAt(0).toUpperCase() + PRODUCT_KEY.slice(1).toLowerCase();

export const resolveRuntimeProductKey = () => PRODUCT_KEY;

export const getActiveProductKey = () => PRODUCT_KEY;
