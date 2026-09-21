import Link from "next/link";
import { SITE_PHONE_DISPLAY, SITE_PHONE_HREF } from "@/lib/site";

export default function AboutPage() {
  return (
    <section className="glass-panel space-y-4">
      <h1 className="section-title">About The Aviators Watch</h1>
      <p className="section-copy max-w-3xl">
        The Aviators Watch is a curated shop for modern and vintage timepieces — chosen for design,
        provenance, and lasting wear, not volume. We look for watches with character: dive icons,
        pilot chronographs, dress pieces, and honest vintage finds that hold up beyond the trend cycle.
      </p>
      <p className="section-copy max-w-3xl">
        Browse current{" "}
        <Link href="/listings" className="font-semibold text-[var(--brand-a)]">
          listings
        </Link>{" "}
        to shop available pieces, or{" "}
        <Link href="/sell" className="font-semibold text-[var(--brand-a)]">
          sell your watch
        </Link>{" "}
        if you have one you no longer wear. We buy running and not running, with or without papers,
        and we also take trades and exchanges.
      </p>
      <p className="section-copy max-w-3xl">
        Every watch we offer is described as we see it — condition, service notes, and what we can
        and cannot confirm. If you have questions about a listing or want a valuation, call{" "}
        <a href={SITE_PHONE_HREF} className="font-semibold text-[var(--brand-a)]">
          {SITE_PHONE_DISPLAY}
        </a>
        . We keep the process straightforward: fair offers, clear communication, and no pressure to
        sell.
      </p>
    </section>
  );
}
