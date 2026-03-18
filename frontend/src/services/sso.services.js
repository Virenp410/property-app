const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

export const readBridgeToken = (payload) =>
  String(
    payload?.bridge_token ||
      payload?.bridgeToken ||
      payload?.data?.bridge_token ||
      payload?.data?.bridgeToken ||
      ""
  ).trim();

export const resolveWebSsoRedirectUrl = async ({
  webAppUrl,
  bridgeToken,
  deviceId,
} = {}) => {
  const baseUrl = normalizeBaseUrl(webAppUrl);
  if (!baseUrl) return "/";

  const homeTarget = `${baseUrl}/`;
  const safeBridgeToken = String(bridgeToken || "").trim();
  if (!safeBridgeToken) return homeTarget;
  const safeDeviceId = String(deviceId || "").trim();

  try {
    const url = new URL(homeTarget);
    url.searchParams.set("bridge_token", safeBridgeToken);
    if (safeDeviceId) {
      url.searchParams.set("device_id", safeDeviceId);
    }
    return url.toString();
  } catch {
    const tokenParam = `bridge_token=${encodeURIComponent(safeBridgeToken)}`;
    const deviceParam = safeDeviceId
      ? `&device_id=${encodeURIComponent(safeDeviceId)}`
      : "";
    return `${homeTarget}?${tokenParam}${deviceParam}`;
  }
};
