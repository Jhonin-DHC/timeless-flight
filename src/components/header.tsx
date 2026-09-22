"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { SITE_PHONE_DISPLAY, SITE_PHONE_HREF } from "@/lib/site";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/listings", label: "Watches" },
  { href: "/limited-editions", label: "Limited Editions" },
  { href: "/vintage", label: "Vintage" },
  { href: "/project-watches", label: "Project Watches" },
  { href: "/sell", label: "Sell Your Branded Watch" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/resources", label: "Resources" }
];

export function Header() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b14]/85 backdrop-blur-xl">
      <div className="container-shell flex items-center justify-between py-4">
        <div className="flex flex-col">
          <Link href="/" className="text-lg font-semibold tracking-wide">
            The Aviators Watch
          </Link>
          <a href={SITE_PHONE_HREF} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            {SITE_PHONE_DISPLAY}
          </a>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm md:gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-3 py-1.5 hover:bg-white/10">
              {link.label}
            </Link>
          ))}
          <Link href="/checkout" className="rounded-full border border-white/20 px-3 py-1.5 hover:bg-white/10">
            Cart ({itemCount})
          </Link>
        </nav>
      </div>
    </header>
  );
}
