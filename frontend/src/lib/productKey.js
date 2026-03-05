const PRODUCT_KEY_PATTERN = /^[a-z0-9_-]{2,64}$/i;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PRODUCT_KEY = String(process.env.NEXT_PUBLIC_PRODUCT_KEY || "").trim();

export const PRODUCT_NAME =
  PRODUCT_KEY.charAt(0).toUpperCase() + PRODUCT_KEY.slice(1).toLowerCase();

const normalizeProductKey = (value) => {
  const key = String(value || "").trim().toLowerCase();
  if (!key) return "";
  if (!PRODUCT_KEY_PATTERN.test(key)) return "";
  if (UUID_PATTERN.test(key)) return "";
  return key;
};

export const resolveRuntimeProductKey = () => {
  const envKey = normalizeProductKey(PRODUCT_KEY);
  return envKey;
};

export const getActiveProductKey = () =>
  String(resolveRuntimeProductKey() || PRODUCT_KEY).trim() || PRODUCT_KEY;
