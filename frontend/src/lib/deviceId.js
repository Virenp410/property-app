export const getDeviceId = () => {
  if (typeof window === "undefined") return "";
  try {
    return String(window.localStorage.getItem("device_id") || "").trim();
  } catch {
    return "";
  }
};

export const getOrCreateDeviceId = () => {
  if (typeof window === "undefined") return "";
  let deviceId = getDeviceId();
  if (deviceId) return deviceId;

  const cryptoObj = typeof crypto !== "undefined" ? crypto : window.crypto;
  deviceId =
    cryptoObj && typeof cryptoObj.randomUUID === "function"
      ? cryptoObj.randomUUID()
      : `dev_${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;

  try {
    window.localStorage.setItem("device_id", deviceId);
  } catch {
    // Ignore storage errors; still return the generated id for this session.
  }

  return deviceId;
};
