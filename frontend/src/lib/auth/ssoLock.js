export const activateSsoLock = () => {
  if (typeof window === "undefined") return;
  window.__ACTIVE_SSO_LOCK__ = true;
};

export const releaseSsoLock = () => {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    delete window.__ACTIVE_SSO_LOCK__;
  }, 1500);
};

export const isSsoLockActive = () =>
  typeof window !== "undefined" && window.__ACTIVE_SSO_LOCK__ === true;
