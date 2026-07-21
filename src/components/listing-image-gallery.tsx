"use client";

import { useState } from "react";
import { RemoteImage } from "@/components/remote-image";

interface ListingImageGalleryProps {
  name: string;
  imageUrl: string;
  imageUrls?: string[];
}

export function ListingImageGallery({ name, imageUrl, imageUrls = [] }: ListingImageGalleryProps) {
  const images = [imageUrl, ...imageUrls.filter((url) => url && url !== imageUrl)];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? imageUrl;

  return (
    <div className="space-y-3">
      <div className="relative h-[300px] w-full overflow-hidden rounded-2xl md:h-[420px]">
        <RemoteImage
          src={activeImage}
          alt={name}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 80vw"
        />
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border ${
                index === activeIndex ? "border-[var(--brand-a)]" : "border-white/15"
              }`}
              aria-label={index === 0 ? "Show main image" : `Show image ${index + 1}`}
            >
              <RemoteImage src={url} alt="" className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
