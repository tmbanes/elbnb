import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cywurzembhxgwqvpsrlh.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'international.uplb.edu.ph',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
