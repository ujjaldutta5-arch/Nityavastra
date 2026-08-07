import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BannerSlider from "@/components/BannerSlider";
import ProductCard from "@/components/ProductCard";
import type { Product, Banner } from "@/types";

export const metadata = {
  title: "Timeless Traditions. Everyday Elegance.",
};

const TRUST = [
  { icon: Truck, title: "Free Shipping", desc: "On orders above Rs 999" },
  { icon: ShieldCheck, title: "Secure Payments", desc: "UPI, Cards, COD" },
  { icon: RotateCcw, title: "7-Day Returns", desc: "Hassle-free exchanges" },
  { icon: Award, title: "Handcrafted Quality", desc: "From India's finest artisans" },
];

const TAG_SECTIONS = [
  { tag: "bestseller" as const, title: "Bestsellers", eyebrow: "Loved by our customers" },
  { tag: "new-arrival" as const, title: "New Arrivals", eyebrow: "Just in" },
];

type CategoryCard = {
  slug: string;
  name: string;
  image?: string | null;
};

async function getHomeData() {
  const supabase = await createClient();

  const [{ data: banners }, { data: categories }, { data: bestsellers }, { data: newArrivals }] =
    await Promise.all([
      supabase
        .from("banners")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true }),
      supabase.from("categories").select("*").is("parent_slug", null).order("name"),
      supabase.from("products").select("*").contains("product_tags", ["bestseller"]).limit(8),
      supabase.from("products").select("*").contains("product_tags", ["new-arrival"]).limit(8),
    ]);

  return {
    banners: (banners || []) as Banner[],
    categories: (categories || []) as CategoryCard[],
    tagSections: {
      bestseller: (bestsellers || []) as Product[],
      "new-arrival": (newArrivals || []) as Product[],
    },
  };
}

export default async function HomePage() {
  const { banners, categories, tagSections } = await getHomeData();

  return (
    <div>
      {banners.length > 0 ? (
        <BannerSlider banners={banners} />
      ) : (
        <section className="relative min-h-[70vh] flex items-center bg-[#2A1508]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 text-white">
            <p className="uppercase text-xs tracking-[0.3em] mb-4 text-[#D4A03A]">
              Sacred Weaves · Everyday Grace
            </p>
            <h1 className="font-serif text-4xl md:text-6xl leading-tight mb-6">
              Timeless Traditions.
              <br />
              Everyday Elegance.
            </h1>
            <Link
              href="/shop"
              data-testid="banner-cta"
              className="inline-flex items-center gap-2 bg-[#7C1F30] hover:bg-[#8D2A3D] text-white px-8 py-4 rounded-full uppercase text-xs tracking-[0.2em]"
            >
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      <section className="border-y border-[#E7E5E4] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 md:py-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F5F4] flex items-center justify-center shrink-0">
                <t.icon className="h-5 w-5 text-[#7C1F30]" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#2A1508]">{t.title}</div>
                <div className="text-xs text-[#78716C]">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24">
        <div className="flex items-end justify-between mb-10 md:mb-12">
          <div>
            <p className="uppercase text-xs tracking-[0.3em] text-[#7C1F30] mb-3">Collections</p>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#2A1508] max-w-lg leading-tight">
              Curated for every corner of your life
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden md:inline-flex items-center gap-2 text-sm hover:text-[#7C1F30] transition-colors"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {(categories.length
            ? categories
            : ([
                { slug: "sarees", name: "Sarees", image: null },
                { slug: "daily-wear", name: "Daily Wear", image: null },
                { slug: "home-essentials", name: "Home Essentials", image: null },
              ] as CategoryCard[])
          )
            .slice(0, 3)
            .map((c) => (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                data-testid={`category-card-${c.slug}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-[#2A1508]"
              >
                {c.image && (
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2A1508]/80 via-[#2A1508]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 md:p-8">
                  <h3 className="font-serif text-2xl md:text-3xl text-white mb-2">{c.name}</h3>
                  <span className="inline-flex items-center gap-2 text-white/90 text-sm">
                    Explore{" "}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {TAG_SECTIONS.map(({ tag, title, eyebrow }) =>
        tagSections[tag]?.length > 0 ? (
          <section
            key={tag}
            className="max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-16"
            data-testid={`section-${tag}`}
          >
            <div className="text-center mb-8 md:mb-10">
              <p className="uppercase text-xs tracking-[0.3em] text-[#7C1F30] mb-3">{eyebrow}</p>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#2A1508] leading-tight">
                {title}
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {tagSections[tag].slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null
      )}

      <section className="bg-[#F5F5F4] border-y border-[#E7E5E4]">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16 md:py-24 text-center">
          <p className="uppercase text-xs tracking-[0.3em] text-[#7C1F30] mb-6">
            What Our Customers Say
          </p>
          <blockquote className="font-serif text-xl sm:text-2xl md:text-3xl leading-relaxed text-[#2A1508] mb-8">
            &ldquo;The saree I ordered arrived beautifully packaged. The craftsmanship is
            exceptional — you can feel the love in every thread.&rdquo;
          </blockquote>
          <div className="text-sm text-[#78716C]">— Priya Sharma, Bengaluru</div>
        </div>
      </section>
    </div>
  );
}
