import api from "./api";

const PRODUCT_KEY = "auto";
const PRODUCT_NAME = "Auto";
const PRODUCT_KEY_CANDIDATES = [PRODUCT_KEY, "seaneb"];

const extractProductList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data?.products)) return data.data.products;
  if (Array.isArray(data?.result?.products)) return data.result.products;
  if (Array.isArray(data?.products?.data)) return data.products.data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const extractProductId = (product) =>
  String(product?.product_id || product?.id || "").trim();

const extractProductKey = (product) =>
  String(product?.product_key || product?.key || "").trim().toLowerCase();

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );

const getActiveProductId = async () => {
  for (const key of PRODUCT_KEY_CANDIDATES) {
    const requestVariants = [{ params: { product_key: key } }, {}];

    for (const variant of requestVariants) {
      try {
        const res = await api.get("/v1/products", variant);
        const list = extractProductList(res.data);
        const matched =
          list.find((item) => extractProductKey(item) === key) || list[0];
        const id = extractProductId(matched);
        if (isUuid(id)) return id;
      } catch (err) {
        const status = Number(err?.response?.status || 0);
        if (![400, 404].includes(status)) {
          // keep trying with fallback keys/endpoints
        }
      }
    }
  }

  return "";
};

const extractCategories = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.data?.categories)) return data.data.categories;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  if (Array.isArray(data?.result?.categories)) return data.result.categories;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const extractCategoryProductKey = (category) =>
  String(
    category?.product_key ||
      category?.product?.product_key ||
      category?.product?.key ||
      ""
  )
    .trim()
    .toLowerCase();

const filterCategoriesByProductKey = (categories, productKey) => {
  const key = String(productKey || "").trim().toLowerCase();
  if (!key || !Array.isArray(categories) || categories.length === 0) return [];

  const tagged = categories.filter((item) => extractCategoryProductKey(item));
  if (!tagged.length) {
    // If backend does not expose product mapping on category rows, keep original list.
    return categories;
  }

  const matched = tagged.filter((item) => extractCategoryProductKey(item) === key);
  return matched.length ? matched : [];
};

export const getAllActiveCategories = async () => {
  try {
    const res = await api.get("/v1/category/categorieslist");
    return extractCategories(res.data);
  } catch (err) {
    const status = Number(err?.response?.status || 0);
    // Network timeouts/transient gateway errors are treated as empty category state.
    if (err?.code === "ECONNABORTED") return [];
    if ([500, 502, 503, 504].includes(status)) return [];
    if (![400, 401, 403, 404, 405].includes(status)) return [];
    return [];
  }
};

export const createMainCategory = async (mainCategoryName, productId) => {
  const name = String(mainCategoryName || "").trim();
  if (!name) return "";

  let finalProductId = String(productId || "").trim();
  if (!finalProductId) {
    finalProductId = await getActiveProductId();
  }
  if (!finalProductId) return "";

  const res = await api.post("/v1/category/create", {
    main_category_name: name,
    product_id: finalProductId,
  });

  const body = res?.data || {};
  return String(
    body?.main_category_id ||
      body?.category_id ||
      body?.data?.main_category_id ||
      body?.data?.category_id ||
      ""
  ).trim();
};

export const getCategories = async () => {
  // 1) Global active categories
  const active = await getAllActiveCategories();
  if (active.length > 0) {
    const filtered = filterCategoriesByProductKey(active, PRODUCT_KEY);
    if (filtered.length > 0) {
      return { categories: filtered };
    }
  }

  // 2) Product-specific fallback.
  const productId = await getActiveProductId();

  if (productId) {
    try {
      const res = await api.post("/v1/category/list", {
        product_id: productId,
      });
      const categories = extractCategories(res.data);

      if (categories.length > 0) {
        return { categories };
      }
    } catch (err) {
      const status = Number(err?.response?.status || 0);
      if (![400, 401, 403, 404, 405].includes(status)) {
        throw err;
      }
    }
  }

  // 3) Optional create-on-demand fallback
  if (productId) {
    try {
      await createMainCategory(PRODUCT_NAME, productId);
      const retryRes = await api.post("/v1/category/list", {
        product_id: productId,
      });
      return { categories: extractCategories(retryRes.data) };
    } catch {
      // no-op, return empty below
    }
  }

  return { categories: [] };
};
