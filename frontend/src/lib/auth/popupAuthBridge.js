"use client";

import {
  getCookie,
  removeCookie,
  setCookie,
} from "@/services/cookieStore";

const RETURN_TO_KEY = "auth_return_to";
const RETURN_ORIGIN_KEY = "auth_return_origin";
export const AUTH_FLOW_COMPLETE_EVENT = "SEANEB_AUTH_FLOW_COMPLETE";

const normalizeUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).toString();
  } catch {
    return "";
  }
};

const normalizeOrigin = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
};

export const savePopupReturnTarget = ({ returnTo, returnOrigin }) => {
  const safeReturnTo = normalizeUrl(returnTo);
  const safeReturnOrigin = normalizeOrigin(returnOrigin);

  if (safeReturnTo) {
    setCookie(RETURN_TO_KEY, safeReturnTo, { days: 1 });
  } else {
    removeCookie(RETURN_TO_KEY);
  }

  if (safeReturnOrigin) {
    setCookie(RETURN_ORIGIN_KEY, safeReturnOrigin, { days: 1 });
  } else {
    removeCookie(RETURN_ORIGIN_KEY);
  }
};

export const clearPopupReturnTarget = () => {
  removeCookie(RETURN_TO_KEY);
  removeCookie(RETURN_ORIGIN_KEY);
};

const readPopupReturnTarget = () => ({
  returnTo: normalizeUrl(getCookie(RETURN_TO_KEY)),
  returnOrigin: normalizeOrigin(getCookie(RETURN_ORIGIN_KEY)),
});

export const notifyParentAndClose = (extra = {}) => {
  if (typeof window === "undefined") return false;

  const { returnTo, returnOrigin } = readPopupReturnTarget();
  const overrideReturnTo = normalizeUrl(extra?.returnTo);
  const finalReturnTo = overrideReturnTo || returnTo;
  const overrideReturnOrigin = normalizeOrigin(extra?.returnOrigin);
  const finalReturnOrigin = overrideReturnOrigin || returnOrigin || normalizeOrigin(finalReturnTo);
  if (!finalReturnTo) return false;

  const payload = {
    type: AUTH_FLOW_COMPLETE_EVENT,
    returnTo: finalReturnTo,
    at: Date.now(),
    ...extra,
  };

  try {
    // Popup auth flow: notify opener page that auth finished, then close popup.
    if (window.opener && !window.opener.closed && finalReturnOrigin) {
      window.opener.postMessage(payload, finalReturnOrigin);
      window.opener.focus();
    }
  } catch {
    // best effort only
  } finally {
    clearPopupReturnTarget();
  }

  try {
    window.close();
  } catch {
    // ignore close failures and fallback below
  }

  const stillOpen = typeof window.closed === "boolean" ? !window.closed : true;
  if (stillOpen) {
    window.location.replace(finalReturnTo);
  }

  return true;
};

