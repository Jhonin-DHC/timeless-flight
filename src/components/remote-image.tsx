"use client";

import Image from "next/image";

interface RemoteImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  onError?: () => void;
}

/** Loads remote (R2) images via Next.js same-origin optimizer so browser DNS for r2.dev is not required. */
export function RemoteImage({ src, alt, className, sizes = "256px", onError }: RemoteImageProps) {
  if (!src) return null;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      onError={onError}
      unoptimized={false}
    />
  );
}
