import axios from "axios";
import { clearAccessToken } from "./apiClient";
export const logout = async () => {
  try {
    await axios.post("/auth/logout", null, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // best effort
  } finally {
    clearAccessToken();
  }
};
