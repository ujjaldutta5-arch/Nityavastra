import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";

const LOGO =
  "https://customer-assets-lqy194kg.emergentagent.net/job_nityavastra-shop/artifacts/dirh3az1_Updated%20Logo%20Nityavastra.png";

export default function Footer() {
  return (
    <footer className="bg-[#1C1917] text-[#FAF3E7] mt-16 md:mt-24" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-5">
              <Image
                src={LOGO}
                alt="Nityavastra"
                width={56}
                height={56}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full"
              />
              <h3 className="font-serif text-2xl md:text-3xl">
                Nityavastra<span className="text-[#D4A03A]">.</span>
              </h3>
            </div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4A03A] mb-4">
              Sacred Weaves · Everyday Grace
            </p>
            <p className="text-sm text-[#FAF3E7]/70 leading-relaxed max-w-sm">
              Handcrafted heritage & everyday essentials — where tradition meets your home.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://instagram.com/nityavastra"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D4A03A] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/nityavastra"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#D4A03A] transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="uppercase text-xs tracking-[0.2em] font-medium mb-4 text-[#D4A03A]">
              Shop
            </h4>
            <ul className="space-y-3 text-sm text-[#FAF3E7]/80">
              <li>
                <Link href="/shop?category=sarees" className="hover:text-white">
                  Sarees
                </Link>
              </li>
              <li>
                <Link href="/shop?category=daily-wear" className="hover:text-white">
                  Daily Wear
                </Link>
              </li>
              <li>
                <Link href="/shop?category=home-essentials" className="hover:text-white">
                  Home Essentials
                </Link>
              </li>
              <li>
                <Link href="/shop?tag=bestseller" className="hover:text-white">
                  Bestsellers
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="uppercase text-xs tracking-[0.2em] font-medium mb-4 text-[#7C1F30]">
              Help
            </h4>
            <ul className="space-y-3 text-sm text-[#FAF3E7]/80">
              <li>
                <Link href="/about" className="hover:text-white" data-testid="footer-about">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white" data-testid="footer-contact">
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/shipping-policy"
                  className="hover:text-white"
                  data-testid="footer-shipping"
                >
                  Shipping
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/return-policy"
                  className="hover:text-white"
                  data-testid="footer-returns"
                >
                  Returns
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/size-guide"
                  className="hover:text-white"
                  data-testid="footer-size"
                >
                  Size Guide
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="uppercase text-xs tracking-[0.2em] font-medium mb-4 text-[#7C1F30]">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-sm text-[#FAF3E7]/80">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" /> Bhubaneswar, Odisha, India 751019
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0" /> +91 87777 87700
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0" /> hello@nityavastra.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 md:mt-16 pt-8 border-t border-[#FAF3E7]/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#FAF3E7]/60">
          <p>© {new Date().getFullYear()} Nityavastra4U. All rights reserved.</p>
          <p>Ships across India · Order via WhatsApp</p>
        </div>
      </div>
    </footer>
  );
}
