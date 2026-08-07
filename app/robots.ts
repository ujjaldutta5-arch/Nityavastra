import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nityavastra.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/checkout", "/cart", "/payment/", "/invoice/", "/admin", "/api/"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
