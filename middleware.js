import { NextResponse } from "next/server";

const resolveProductKey = () => {
  const key = String(process.env.NEXT_PUBLIC_PRODUCT_KEY || "auto").trim();
  return key || "auto";
};
const resolveWebAppUrl = () =>
  String(process.env.NEXT_PUBLIC_WEB_APP_URL || "http://localhost:1003")
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
  const refreshToken =
    request.cookies.get(`refresh_token_${productKey}`)?.value ||
    request.cookies.get("refresh_token")?.value;
  const csrfToken =
    request.cookies.get(`csrf_token_${productKey}`)?.value ||
    request.cookies.get("csrf_token")?.value;

  const isAuthenticated = Boolean(refreshToken || csrfToken);

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
