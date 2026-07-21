"use client";

import Image from "next/image";
import { toDisplayImageUrl } from "@/lib/r2-display";

interface RemoteImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  onError?: () => void;
}

/**
 * R2 images are loaded via same-origin /api/media proxy (no browser DNS for r2.dev needed).
 * Other remotes (e.g. Unsplash) use next/image.
 */
export function RemoteImage({ src, alt, className, sizes = "256px", onError }: RemoteImageProps) {
  if (!src) return null;

  const displaySrc = toDisplayImageUrl(src);

  if (displaySrc.startsWith("/api/media/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={displaySrc}
        alt={alt}
        className={`absolute inset-0 h-full w-full ${className ?? ""}`}
        onError={onError}
      />
    );
  }

  return (
    <Image src={displaySrc} alt={alt} fill className={className} sizes={sizes} onError={onError} />
  );
}
