/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "upbwksdhsfzquzkrscsz.supabase.co" },
      { protocol: "https", hostname: "customer-assets-lqy194kg.emergentagent.net" },
    ],
  },
};

export default nextConfig;
