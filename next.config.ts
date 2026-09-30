import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nzvepysnmmzznwljvvpe.supabase.co',
      },
    ],
  },
};

export default nextConfig;
