import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/rpc/:path*',
        destination: 'https://rpc.sepolia.org/:path*',
      },
    ];
  },
};

export default nextConfig;
