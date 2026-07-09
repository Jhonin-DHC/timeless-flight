import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Timeless Flight | Curated Timepieces",
  description: "Curated luxury watches with a modern glassmorphism browsing experience."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
