"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { Banner } from "@/types";

export default function BannerSlider({ banners = [] as Banner[] }: { banners?: Banner[] }) {
  const [idx, setIdx] = useState(0);
  const total = banners.length;

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % total), 6500);
    return () => clearInterval(t);
  }, [total]);

  if (total === 0) return null;
  const b = banners[idx];
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    <section
      className="relative min-h-[70vh] md:min-h-[85vh] flex items-center overflow-hidden group"
      data-testid="banner-slider"
    >
      {banners.map((banner, i) => (
        <div
          key={banner.id || i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {banner.image && (
            <Image
              src={banner.image}
              alt={banner.title || "Banner"}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#2A1508]/70 via-[#2A1508]/30 to-transparent" />
        </div>
      ))}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 w-full">
        <div className="max-w-xl text-white">
          <p className="uppercase text-xs tracking-[0.3em] mb-4 md:mb-6 text-[#D4A03A]">
            Sacred Weaves · Everyday Grace
          </p>
          <h1
            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight md:leading-none mb-4 md:mb-6"
            data-testid="banner-title"
          >
            {b.title}
          </h1>
          <p className="text-sm sm:text-base md:text-lg mb-8 md:mb-10 text-white/90 leading-relaxed">
            {b.subtitle}
          </p>
          {b.cta_link && (
            <Link
              href={b.cta_link}
              data-testid="banner-cta"
              className="inline-flex items-center gap-2 bg-[#7C1F30] hover:bg-[#8D2A3D] text-white px-6 md:px-8 py-3 md:py-4 rounded-full uppercase text-xs tracking-[0.2em] font-medium transition-colors"
            >
              {b.cta_text || "Shop Now"} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
      {total > 1 && (
        <>
          <button
            onClick={prev}
            data-testid="banner-prev"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 flex items-center justify-center transition md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={next}
            data-testid="banner-next"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 flex items-center justify-center transition md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                data-testid={`banner-dot-${i}`}
                className={`h-1.5 transition-all rounded-full ${
                  i === idx ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
