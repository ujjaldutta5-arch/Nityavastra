"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";

export type GalleryMediaItem = {
  kind: string;
  url: string;
};

export default function ProductGallery({
  media = [],
  fallbackImage,
  alt = "",
}: {
  media?: GalleryMediaItem[];
  fallbackImage?: string | null;
  alt?: string;
}) {
  const items: GalleryMediaItem[] =
    media.length > 0
      ? media
      : fallbackImage
        ? [{ kind: "image", url: fallbackImage }]
        : [];

  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIdx(0);
  }, [media.length, fallbackImage]);

  if (items.length === 0) {
    return <div className="aspect-[3/4] bg-[#F5F5F4] rounded-lg" />;
  }

  const current = items[idx];
  const total = items.length;
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  const onMove = (e: React.MouseEvent) => {
    if (current.kind === "video" || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ active: true, x, y });
  };

  return (
    <div className="space-y-3" data-testid="product-gallery">
      <div
        ref={frameRef}
        className="relative aspect-[3/4] overflow-hidden rounded-lg bg-[#F5F5F4] group"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
      >
        {current.kind === "video" ? (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            className="w-full h-full object-cover"
            data-testid="gallery-video"
          />
        ) : (
          <Image
            key={current.url}
            src={current.url}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-cover transition-transform duration-200 ${
              zoom.active ? "scale-150" : "scale-100"
            }`}
            style={
              zoom.active
                ? { transformOrigin: `${zoom.x}% ${zoom.y}%` }
                : { transformOrigin: "center" }
            }
            data-testid="gallery-image"
            priority
          />
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              data-testid="gallery-prev"
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shadow-sm z-10"
            >
              <ChevronLeft className="h-5 w-5 text-[#2A1508]" />
            </button>
            <button
              type="button"
              onClick={next}
              data-testid="gallery-next"
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shadow-sm z-10"
            >
              <ChevronRight className="h-5 w-5 text-[#2A1508]" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  data-testid={`gallery-dot-${i}`}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`transition-all rounded-full ${
                    i === idx ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/60 hover:bg-white/90"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {items.map((m, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              data-testid={`gallery-thumb-${i}`}
              className={`relative aspect-square rounded-md overflow-hidden ring-offset-2 transition-all ${
                i === idx
                  ? "ring-2 ring-[#7C1F30]"
                  : "ring-1 ring-[#E7E5E4] hover:ring-[#7C1F30]/60"
              }`}
            >
              {m.kind === "video" ? (
                <div className="relative w-full h-full bg-[#2A1508]">
                  <video
                    src={m.url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <PlayCircle className="absolute inset-0 m-auto h-5 w-5 text-white" />
                </div>
              ) : (
                <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
