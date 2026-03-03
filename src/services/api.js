import apiClient, { clearAccessToken, setAccessToken } from "@/lib/auth/apiClient";
import { logout } from "@/lib/auth/authService";

export const setSessionTokens = ({ access_token } = {}) => {
  const token = String(access_token || "").trim();
  if (token) {
    setAccessToken(token);
    return;
  }
  clearAccessToken();
};

export const clearSession = () => {
  clearAccessToken();
};

export const clearServerSession = async () => {
  await logout();
};

export default apiClient;
