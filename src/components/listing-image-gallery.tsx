"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RemoteImage } from "@/components/remote-image";
import { toDisplayImageUrl } from "@/lib/r2-display";

interface ListingImageGalleryProps {
  name: string;
  imageUrl: string;
  imageUrls?: string[];
}

export function ListingImageGallery({ name, imageUrl, imageUrls = [] }: ListingImageGalleryProps) {
  const images = [imageUrl, ...imageUrls.filter((url) => url && url !== imageUrl)];
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeImage = images[activeIndex] ?? imageUrl;

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      } else if (event.key === "ArrowRight") {
        setActiveIndex((index) => (index + 1) % images.length);
      } else if (event.key === "ArrowLeft") {
        setActiveIndex((index) => (index - 1 + images.length) % images.length);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen, images.length]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="relative block h-[300px] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-black/35 md:h-[420px]"
        aria-label={`View ${name} at full size`}
      >
        <RemoteImage
          src={activeImage}
          alt={name}
          className="object-contain object-center"
          sizes="(max-width: 768px) 100vw, 80vw"
        />
      </button>
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
      {lightboxOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
              role="dialog"
              aria-modal="true"
              aria-label={`${name} photo`}
              onClick={() => setLightboxOpen(false)}
            >
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full border border-white/25 bg-black/50 px-3 py-1 text-sm"
              >
                Close
              </button>
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/25 bg-black/50 px-3 py-2 text-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveIndex((index) => (index - 1 + images.length) % images.length);
                    }}
                    aria-label="Previous image"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/25 bg-black/50 px-3 py-2 text-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveIndex((index) => (index + 1) % images.length);
                    }}
                    aria-label="Next image"
                  >
                    Next
                  </button>
                </>
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={toDisplayImageUrl(activeImage)}
                alt={name}
                className="h-auto w-auto max-h-[calc(100vh-2.5rem)] max-w-[calc(100vw-2.5rem)] object-contain"
                onClick={(event) => event.stopPropagation()}
              />
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
