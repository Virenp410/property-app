import { NextResponse } from "next/server";

const normalizeApiOrigin = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/i, "")
    .replace(/\/api$/i, "");

const resolveApiOrigin = () => {
  const mode = String(process.env.NEXT_ENV || process.env.NODE_ENV || "")
    .trim()
    .toLowerCase();
  const devOrigin = normalizeApiOrigin(process.env.NEXT_PUBLIC_DEV_URL);
  const centralOrigin = normalizeApiOrigin(process.env.NEXT_PUBLIC_CENTRAL_URL);
  return mode === "development"
    ? devOrigin || centralOrigin
    : centralOrigin || devOrigin;
};

const API_ORIGIN = resolveApiOrigin();
const normalizeCookieDomain = (value) => {
  const domain = String(value || "").trim();
  if (!domain) return "";
  if (domain === "localhost") return "";
  return domain;
};
const cookieDomain = normalizeCookieDomain(process.env.COOKIE_DOMAIN);

const FORWARDED_HEADER_NAMES = [
  "content-type",
  "authorization",
  "x-product-key",
  "x-csrf-token",
  "origin",
  "referer",
  "cookie",
];

const isHttpsRequest = (request) =>
  String(request?.nextUrl?.protocol || "").toLowerCase() === "https:";

const getCookieOptions = (request) => {
  const isHttps = isHttpsRequest(request);
  const options = {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    path: "/",
  };

  if (cookieDomain) {
    options.domain = cookieDomain;
  }

  return options;
};

const isTokenCookieName = (name) => {
  const key = String(name || "").trim();
  if (!key) return false;
  if (key === "refresh_token_auto" || key === "csrf_token_auto") return true;
  if (key === "refresh_token" || key === "csrf_token") return true;
  if (key.startsWith("refresh_token_") || key.startsWith("csrf_token_")) return true;
  return false;
};

const splitSetCookieAttributes = (cookie) =>
  String(cookie || "")
    .split(";")
    .map((part) => String(part || "").trim())
    .filter(Boolean);

const normalizeSetCookie = (cookie, request) => {
  const parts = splitSetCookieAttributes(cookie);
  if (!parts.length) return "";

  const [nameValue, ...attributes] = parts;
  const cookieName = String(nameValue.split("=")[0] || "").trim();
  if (!isTokenCookieName(cookieName)) return cookie;

  const cookieOptions = getCookieOptions(request);
  const normalized = [];

  for (const attr of attributes) {
    const [rawName] = attr.split("=");
    const name = String(rawName || "").trim().toLowerCase();
    if (!name) continue;

    if (name === "domain") continue;
    if (name === "path") continue;
    if (name === "secure") continue;
    if (name === "httponly") continue;
    if (name === "samesite") continue;

    normalized.push(attr);
  }

  normalized.push(`Path=${cookieOptions.path}`);
  normalized.push(`SameSite=${cookieOptions.sameSite === "none" ? "None" : "Lax"}`);
  if (cookieOptions.secure) normalized.push("Secure");
  if (cookieOptions.httpOnly) normalized.push("HttpOnly");
  if (cookieOptions.domain) normalized.push(`Domain=${cookieOptions.domain}`);

  return [nameValue, ...normalized].join("; ");
};

const readPathFromParams = (params) => {
  const parts = Array.isArray(params?.path) ? params.path : [];
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("/");
};

const parseJsonBody = (rawBody) => {
  const text = String(rawBody || "").trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const shouldSendBody = (method) =>
  !["GET", "HEAD"].includes(String(method || "").toUpperCase());

const decodeJwtPayload = (token) => {
  const value = String(token || "").trim();
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const payload = parts[1];
  if (!payload) return null;
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = `${base64}${"=".repeat(padLength)}`;
  try {
    const jsonText = Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(jsonText);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const pickRefreshProductKey = (request) => {
  const refreshToken = String(
    request.cookies.get("refresh_token_auto")?.value ||
      request.cookies.get("refresh_token")?.value ||
      ""
  ).trim();
  if (!refreshToken) return "";
  const payload = decodeJwtPayload(refreshToken);
  return String(
    payload?.product_key ||
      payload?.productKey ||
      payload?.product_id ||
      payload?.productId ||
      ""
  )
    .trim()
    .toLowerCase();
};

const getProductKey = (request, payload) => {
  return String(
    payload?.product_key ||
      payload?.productKey ||
      request.headers.get("x-product-key") ||
      process.env.NEXT_PUBLIC_PRODUCT_KEY ||
      ""
  )
    .trim()
    .toLowerCase();
};

const buildProxyHeaders = (request, productKey) => {
  const headers = new Headers();

  for (const name of FORWARDED_HEADER_NAMES) {
    const value = String(request.headers.get(name) || "").trim();
    if (value) headers.set(name, value);
  }

  if (productKey && !headers.get("x-product-key")) {
    headers.set("x-product-key", productKey);
  }

  if (!headers.get("x-csrf-token")) {
    const csrfToken = String(
      (productKey ? request.cookies.get(`csrf_token_${productKey}`)?.value : "") ||
        request.cookies.get("csrf_token_auto")?.value ||
        request.cookies.get("csrf_token")?.value ||
        ""
    ).trim();
    if (csrfToken) headers.set("x-csrf-token", csrfToken);
  }

  return headers;
};

const forwardSetCookieHeaders = (upstream, response, request) => {
  if (typeof upstream.headers.getSetCookie === "function") {
    const cookies = upstream.headers.getSetCookie();
    for (const cookie of cookies) {
      const normalized = normalizeSetCookie(cookie, request);
      if (normalized) response.headers.append("set-cookie", normalized);
    }
    return;
  }

  const combined = String(upstream.headers.get("set-cookie") || "").trim();
  if (!combined) return;

  const cookies = [];
  let current = "";
  let inExpires = false;

  for (let i = 0; i < combined.length; i += 1) {
    const char = combined[i];
    const lower = combined.slice(i, i + 8).toLowerCase();

    if (!inExpires && lower === "expires=") {
      inExpires = true;
      current += combined.slice(i, i + 8);
      i += 7;
      continue;
    }

    if (inExpires && char === ";") {
      inExpires = false;
      current += char;
      continue;
    }

    if (!inExpires && char === ",") {
      const value = current.trim();
      if (value) cookies.push(value);
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) cookies.push(tail);

  for (const cookie of cookies) {
    const normalized = normalizeSetCookie(cookie, request);
    if (normalized) response.headers.append("set-cookie", normalized);
  }
};

const createProxyResponse = async (request, upstream) => {
  const bodyText = await upstream.text();
  const response = new NextResponse(bodyText, { status: upstream.status });

  const contentType = upstream.headers.get("content-type");
  if (contentType) response.headers.set("content-type", contentType);

  forwardSetCookieHeaders(upstream, response, request);

  const csrfFromHeader = String(
    upstream.headers.get("x-csrf-token") || upstream.headers.get("csrf-token") || ""
  ).trim();

  if (csrfFromHeader) {
    response.cookies.set({
      name: "csrf_token",
      value: csrfFromHeader,
      httpOnly: false,
      secure: isHttpsRequest(request),
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
};

const handleProxy = async (request, context) => {
  if (!API_ORIGIN) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "API_ORIGIN_MISSING", message: "API origin is not configured" },
      },
      { status: 500 }
    );
  }

  const method = String(request.method || "GET").toUpperCase();
  const resolvedParams = await Promise.resolve(context?.params).catch(() => ({}));
  const pathKey = readPathFromParams(resolvedParams);

  if (!pathKey) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_PROXY_PATH", message: "Missing API path" },
      },
      { status: 404 }
    );
  }

  const rawBody = shouldSendBody(method) ? await request.text() : "";
  const payload = parseJsonBody(rawBody);
  const productKey = getProductKey(request, payload);

  const headers = buildProxyHeaders(request, productKey);
  const upstreamUrl = `${API_ORIGIN}/api/${pathKey}${request.nextUrl.search}`;

  const sendUpstream = async (nextHeaders, nextBody) => {
    return fetch(upstreamUrl, {
      method,
      headers: nextHeaders,
      cache: "no-store",
      body: shouldSendBody(method) ? nextBody : undefined,
    });
  };

  let upstream;
  try {
    upstream = await sendUpstream(headers, rawBody);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: `Unable to reach upstream endpoint: /api/${pathKey}`,
        },
      },
      { status: 502 }
    );
  }

  if (pathKey === "v1/auth/refresh" && upstream.status === 401) {
    const refreshProductKey = pickRefreshProductKey(request);
    if (refreshProductKey && refreshProductKey !== productKey) {
      const retryPayload = { ...payload, product_key: refreshProductKey };
      const retryHeaders = buildProxyHeaders(request, refreshProductKey);
      try {
        const retryUpstream = await sendUpstream(
          retryHeaders,
          JSON.stringify(retryPayload)
        );
        return createProxyResponse(request, retryUpstream);
      } catch {
        return createProxyResponse(request, upstream);
      }
    }
  }

  return createProxyResponse(request, upstream);
};

export async function GET(request, context) {
  return handleProxy(request, context);
}

export async function POST(request, context) {
  return handleProxy(request, context);
}

export async function PUT(request, context) {
  return handleProxy(request, context);
}

export async function PATCH(request, context) {
  return handleProxy(request, context);
}

export async function DELETE(request, context) {
  return handleProxy(request, context);
}

export async function OPTIONS(request, context) {
  return handleProxy(request, context);
}

export async function HEAD(request, context) {
  return handleProxy(request, context);
}
