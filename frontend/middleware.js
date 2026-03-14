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
 
const resolveProductKey = () => {
  const key = String(process.env.NEXT_PUBLIC_PRODUCT_KEY || "auto").trim();
  return key || "auto";
};
const resolveWebAppUrl = () =>
  String(process.env.NEXT_PUBLIC_WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL)
    .replace(/\/$/, "");
 
const isLoginRoute = (pathname) => pathname.startsWith("/auth/login");
 
const isProtectedRoute = (pathname) =>
  pathname.startsWith("/auth/success") ||
  pathname.startsWith("/auth/post-register") ||
  pathname.startsWith("/auth/dealerdash") ||
  pathname.startsWith("/auth/business-reg");
 
const getRequestedPathWithQuery = (url) => {
  const pathname = String(url?.pathname || "").trim();
  const search = String(url?.search || "").trim();
  if (!pathname) return "";
  return `${pathname}${search}`;
};
 
const getSafeInternalNextPath = (searchParams) => {
  const next = String(searchParams?.get("next") || "").trim();
  if (!next) return "";
  if (!next.startsWith("/")) return "";
  if (next.startsWith("//")) return "";
  if (next.startsWith("/auth/login")) return "";
  return next;
};
 
export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
 
  const productKey = resolveProductKey();
  const accessToken =
    request.cookies.get(`access_token_${productKey}`)?.value ||
    request.cookies.get("access_token_auto")?.value ||
    request.cookies.get("access_token")?.value;
  const refreshToken =
    request.cookies.get(`refresh_token_${productKey}`)?.value ||
    request.cookies.get("refresh_token_auto")?.value ||
    request.cookies.get("refresh_token")?.value;
  const csrfToken =
    request.cookies.get(`csrf_token_${productKey}`)?.value ||
    request.cookies.get("csrf_token_auto")?.value ||
    request.cookies.get("csrf_token")?.value;
 
  const hasValidAccessToken = isJwtNotExpired(accessToken);
  const isAuthenticated = Boolean(hasValidAccessToken || refreshToken || csrfToken);
 
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const redirectUrl = new URL("/auth/login", request.url);
    const requestedPath = getRequestedPathWithQuery(request.nextUrl);
    if (requestedPath) {
      redirectUrl.searchParams.set("next", requestedPath);
    }
    return NextResponse.redirect(redirectUrl);
  }
 
  if (!isAuthenticated || !isLoginRoute(pathname)) {
    return NextResponse.next();
  }
 
  const nextPath = getSafeInternalNextPath(searchParams);
  const redirectUrl = nextPath
    ? new URL(nextPath, request.url)
    : new URL(resolveWebAppUrl());
  return NextResponse.redirect(redirectUrl);
}
 
export const config = {
  matcher: ["/auth/:path*"],
};