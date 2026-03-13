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

const FORWARDED_HEADER_NAMES = [
  "content-type",
  "authorization",
  "x-product-key",
  "x-csrf-token",
  "cookie",
];

const isHttpsRequest = (request) =>
  String(request?.nextUrl?.protocol || "").toLowerCase() === "https:";

/*
 COOKIE NORMALIZATION */

const splitSetCookieAttributes = (cookie) =>
  String(cookie || "")
    .split(";")
    .map((p) => String(p || "").trim())
    .filter(Boolean);

const normalizeSetCookie = (cookie, request) => {
  const parts = splitSetCookieAttributes(cookie);
  if (!parts.length) return "";

  const [nameValue, ...attributes] = parts;

  const normalized = [];
  let hasPath = false;
  let hasSecure = false;

  for (const attr of attributes) {
    const [rawName] = attr.split("=");
    const name = String(rawName || "").trim().toLowerCase();

    if (!name) continue;

    /* rewrite domain instead of removing */
    if (name === "domain") {
      normalized.push(`Domain=${request.nextUrl.hostname}`);
      continue;
    }

    if (name === "path") {
      hasPath = true;
      normalized.push("Path=/");
      continue;
    }

    if (name === "secure") {
      hasSecure = true;
      normalized.push("Secure");
      continue;
    }

    normalized.push(attr);
  }

  if (!hasPath) normalized.push("Path=/");

  if (isHttpsRequest(request) && !hasSecure) {
    normalized.push("Secure");
  }

  return [nameValue, ...normalized].join("; ");
};

/*
 PATH UTIL
*/

const readPathFromParams = (params) => {
  const parts = Array.isArray(params?.path) ? params.path : [];

  return parts
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .join("/");
};

/*
 BODY*/

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

/*
 PRODUCT KEY */

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

/*
 HEADERS*/

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
      request.cookies.get("csrf_token_auto")?.value ||
        request.cookies.get("csrf_token")?.value ||
        ""
    ).trim();

    if (csrfToken) headers.set("x-csrf-token", csrfToken);
  }

  return headers;
};

/*
 COOKIE FORWARD
 */

const forwardSetCookieHeaders = (request, upstream, response) => {
  const raw = upstream.headers.get("set-cookie");

  if (!raw) return;

  const cookies = raw.split(/,(?=[^;]+=[^;]+)/);

  for (const cookie of cookies) {
    const normalized = normalizeSetCookie(cookie, request);

    if (normalized) {
      response.headers.append("set-cookie", normalized);
    }
  }
};

/*
 RESPONSE*/

const createProxyResponse = async (request, upstream) => {
  const body = await upstream.text();

  const response = new NextResponse(body, {
    status: upstream.status,
  });

  const contentType = upstream.headers.get("content-type");

  if (contentType) {
    response.headers.set("content-type", contentType);
  }

  forwardSetCookieHeaders(request, upstream, response);

  const csrfHeader = String(
    upstream.headers.get("x-csrf-token") ||
      upstream.headers.get("csrf-token") ||
      ""
  ).trim();

  if (csrfHeader) {
    response.cookies.set({
      name: "csrf_token",
      value: csrfHeader,
      httpOnly: false,
      secure: isHttpsRequest(request),
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
};

/*
 MAIN PROXY*/

const handleProxy = async (request, context) => {
  if (!API_ORIGIN) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "API_ORIGIN_MISSING",
          message: "API origin is not configured",
        },
      },
      { status: 500 }
    );
  }

  const method = String(request.method || "GET").toUpperCase();

  const params = await Promise.resolve(context?.params).catch(() => ({}));

  const pathKey = readPathFromParams(params);

  if (!pathKey) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_PROXY_PATH",
          message: "Missing API path",
        },
      },
      { status: 404 }
    );
  }

  const rawBody = shouldSendBody(method) ? await request.text() : "";

  const payload = parseJsonBody(rawBody);

  const productKey = getProductKey(request, payload);

  const headers = buildProxyHeaders(request, productKey);

  const upstreamUrl = `${API_ORIGIN}/api/${pathKey}${request.nextUrl.search}`;

  let upstream;

  try {
    upstream = await fetch(upstreamUrl, {
      method,
      headers,
      cache: "no-store",
      credentials: "include",
      body: shouldSendBody(method) ? rawBody : undefined,
    });
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

  return createProxyResponse(request, upstream);
};

/*
 HTTP METHODS*/

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