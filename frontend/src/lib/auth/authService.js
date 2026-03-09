import axios from "axios";
import { clearAccessToken } from "./apiClient";
import { getActiveProductKey } from "@/lib/productKey";

export const logout = async () => {
  try {
    await axios.post(
      "/api/v1/logout",
      { product_key: getActiveProductKey() },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    // best effort
  } finally {
    clearAccessToken();
  }
};
