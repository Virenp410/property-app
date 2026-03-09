import { NextResponse } from "next/server";

const isJwtFormat = (value) =>
  /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(String(value || "").trim());

const decodeJwtPayload = (token) => {
  const parts = String(token || "").trim().split(".");
  if (parts.length !== 3) return null;

  const payload = parts[1];
  if (!payload) return null;

  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = `${base64}${"=".repeat(padLength)}`;

  try {
    const jsonText = atob(padded);
    const parsed = JSON.parse(jsonText);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const isJwtNotExpired = (token) => {
  if (!isJwtFormat(token)) return false;

  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp || 0);
  if (!Number.isFinite(exp) || exp <= 0) return false;

  const now = Math.floor(Date.now() / 1000);
  return exp > now;
};

const hasValidAccessTokenCookie = (request) => {
  const accessToken = String(request.cookies.get("access_token")?.value || "").trim();
  return isJwtNotExpired(accessToken);
};

const hasRefreshTokenCookie = (request) => {
  const refreshToken = String(request.cookies.get("refresh_token")?.value || "").trim();
  const refreshTokenAuto = String(request.cookies.get("refresh_token_auto")?.value || "").trim();
  return Boolean(refreshToken || refreshTokenAuto);
};

export function middleware(request) {
  if (hasValidAccessTokenCookie(request)) {
    return NextResponse.next();
  }

  if (hasRefreshTokenCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/auth/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/auth/dealerdash", "/auth/business-reg"],
};
