/** @type {import('next').NextConfig} */
const normalizeApiOrigin = (value, fallback) => {
  const normalized = String(value || fallback || "")
    .trim()
    .replace(/\/+$/, "");
  return normalized
    .replace(/\/api\/v1$/i, "")
    .replace(/\/api$/i, "");
};

const envMode = String(process.env.NEXT_ENV || process.env.NODE_ENV || "")
  .trim()
  .toLowerCase();

const apiOrigin =
  envMode === "development"
    ? normalizeApiOrigin(process.env.NEXT_PUBLIC_DEV_URL, "https://dev.seaneb.com")
    : normalizeApiOrigin(process.env.NEXT_PUBLIC_CENTRAL_URL, "https://central-api.seaneb.com");

const nextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
