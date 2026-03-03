import api from "./api";
import { PRODUCT_KEY } from "@/lib/productKey";

const readList = (payload) => payload?.data || [];

export const getAllActiveCategories = async () => {
  const response = await api.post("/v1/category/list", {
    product_key: PRODUCT_KEY,
  });
  return readList(response.data);
};

export const createMainCategory = async (mainCategoryName, productId) => {
  const name = String(mainCategoryName || "").trim();
  const id = String(productId || "").trim();
  if (!name || !id) return "";

  const response = await api.post("/v1/category/create", {
    main_category_name: name,
    product_id: id,
  });

  return String(response.data?.data?.main_category_id || "").trim();
};

export const getCategories = async () => {
  const categories = await getAllActiveCategories();
  return { categories };
};
