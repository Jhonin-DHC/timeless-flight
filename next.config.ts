import type { NextConfig } from "next";
import path from "path";

function getConfiguredR2Hostname() {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!baseUrl) return null;
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return null;
  }
}

const configuredR2Hostname = getConfiguredR2Hostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      // Allow all Cloudflare R2 public development hosts (build-time env may be missing).
      {
        protocol: "https",
        hostname: "*.r2.dev"
      },
      {
        protocol: "https",
        hostname: "images.theaviatorswatch.com"
      },
      ...(configuredR2Hostname
        ? [
            {
              protocol: "https" as const,
              hostname: configuredR2Hostname
            }
          ]
        : [])
    ]
  },
  turbopack: {
    root: path.resolve(__dirname)
  }
};

export default nextConfig;
