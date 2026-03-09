const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

export const readBridgeToken = (payload) =>
  String(
    payload?.bridge_token ||
      payload?.bridgeToken ||
      payload?.data?.bridge_token ||
      payload?.data?.bridgeToken ||
      ""
  ).trim();

export const resolveWebSsoRedirectUrl = async ({ webAppUrl, bridgeToken } = {}) => {
  const baseUrl = normalizeBaseUrl(webAppUrl);
  if (!baseUrl) return "/";

  const homeTarget = `${baseUrl}/`;
  const safeBridgeToken = String(bridgeToken || "").trim();
  if (!safeBridgeToken) return homeTarget;

  try {
    const url = new URL(homeTarget);
    url.searchParams.set("bridge_token", safeBridgeToken);
    return url.toString();
  } catch {
    return `${homeTarget}?bridge_token=${encodeURIComponent(safeBridgeToken)}`;
  }
};
