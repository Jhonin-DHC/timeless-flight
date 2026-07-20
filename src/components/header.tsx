"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/listings", label: "Listings" },
  { href: "/sell", label: "Sell Your Watch" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/resources", label: "Resources" }
];

export function Header() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b14]/85 backdrop-blur-xl">
      <div className="container-shell flex items-center justify-between py-4">
        <Link href="/" className="text-lg font-semibold tracking-wide">The Aviators Watch</Link>
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
