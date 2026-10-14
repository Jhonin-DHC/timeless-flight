import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Aviators Watch | Curated Timepieces",
    template: "%s | The Aviators Watch"
  },
  description:
    "Shop branded watches by brand, model, or reference — current pieces, vintage, limited editions, and project watches."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
