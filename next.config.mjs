/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://dev.seaneb.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
