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
      request.cookies.get("csrf_token_auto")?.value ||
        request.cookies.get("csrf_token")?.value ||
        ""
    ).trim();
    if (csrfToken) headers.set("x-csrf-token", csrfToken);
  }

  return headers;
};

const forwardSetCookieHeaders = (upstream, response) => {
  if (typeof upstream.headers.getSetCookie === "function") {
    const cookies = upstream.headers.getSetCookie();
    for (const cookie of cookies) {
      response.headers.append("set-cookie", cookie);
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
    response.headers.append("set-cookie", cookie);
  }
};

const createProxyResponse = async (request, upstream) => {
  const bodyText = await upstream.text();
  const response = new NextResponse(bodyText, { status: upstream.status });

  const contentType = upstream.headers.get("content-type");
  if (contentType) response.headers.set("content-type", contentType);

  forwardSetCookieHeaders(upstream, response);

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

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, {
      method,
      headers,
      cache: "no-store",
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
