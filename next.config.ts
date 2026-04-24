import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cywurzembhxgwqvpsrlh.supabase.co",
      },
      {
        protocol: "https",
        hostname: "international.uplb.edu.ph",
      },
    ],
  },
};

export default nextConfig;
