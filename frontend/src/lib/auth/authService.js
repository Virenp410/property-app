import api, { clearAccessToken } from "./apiClient";
import { getActiveProductKey } from "@/lib/productKey";

export const logout = async () => {
  try {
    await api.post("/v1/logout", { product_key: getActiveProductKey() });
  } catch {
    // best effort
  } finally {
    clearAccessToken();
  }
};
