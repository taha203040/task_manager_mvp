import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*", // ✅ صحّحنا المسار بإضافة :path*
        destination: "http://localhost:4000/api/v1/:path*", // ✅ توجيه صحيح نحو خادم Express
      },
    ];
  },
};

export default nextConfig;
