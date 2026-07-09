import type { NextConfig } from "next";
import path from "path";

function getR2RemotePattern() {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!baseUrl) return null;

  try {
    const hostname = new URL(baseUrl).hostname;
    return {
      protocol: "https" as const,
      hostname
    };
  } catch {
    return null;
  }
}

const r2Pattern = getR2RemotePattern();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      ...(r2Pattern ? [r2Pattern] : [])
    ]
  },
  turbopack: {
    root: path.resolve(__dirname)
  }
};

export default nextConfig;
