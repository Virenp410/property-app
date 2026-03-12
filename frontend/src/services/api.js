// import apiClient, { setAccessToken } from "@/lib/auth/apiClient";
// import { logout } from "@/lib/auth/authService";

// export const setSessionTokens = ({ access_token } = {}) => {
//   const token = String(access_token || "").trim();
//   if (token) {
//     setAccessToken(token);
//     return;
//   }
//   clearAccessToken();
// };

// export const clearServerSession = async () => {
//   await logout();
// };

// export default apiClient;


import apiClient, { clearAccessToken, setAccessToken } from "@/lib/auth/apiClient";
import { logout } from "@/lib/auth/authService";

const removeBrowserCookie = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
};

const setBrowserCookie = (name, value) => {
  if (typeof document === "undefined") return;
  const safeValue = encodeURIComponent(String(value ?? ""));
  const secureFlag =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${safeValue}; Path=/; SameSite=Lax${secureFlag}`;
};

const storeCsrfToken = (csrfToken) => {
  const nextValue = String(csrfToken || "").trim();
  if (!nextValue) return;
  setBrowserCookie("csrf_token_auto", nextValue);
  removeBrowserCookie("csrf_token");
};

export const setSessionTokens = (tokens = {}) => {
  const { access_token, csrf_token } = tokens;
  const hasAccessKey = Object.prototype.hasOwnProperty.call(tokens, "access_token");
  const hasCsrfKey = Object.prototype.hasOwnProperty.call(tokens, "csrf_token");

  if (hasAccessKey) {
    const token = String(access_token || "").trim();
    if (token) {
      setAccessToken(token);
    } else {
      clearAccessToken();
    }
  }

  if (hasCsrfKey && csrf_token) {
    storeCsrfToken(csrf_token);
  }
};

export const clearServerSession = async () => {
  await logout();
};

export default apiClient;
