import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_API_URL ? `${process.env.BACKEND_API_URL}/api/:path*` : 'http://127.0.0.1:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
