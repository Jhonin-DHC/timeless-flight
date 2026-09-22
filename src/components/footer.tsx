import { SITE_PHONE_DISPLAY, SITE_PHONE_HREF } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 py-8 text-sm text-[var(--muted)]">
      <div className="container-shell flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <p>© {new Date().getFullYear()} The Aviators Watch</p>
        <div className="flex flex-wrap gap-4">
          <a href={SITE_PHONE_HREF}>{SITE_PHONE_DISPLAY}</a>
          <a href="/listings">Watches</a>
          <a href="/limited-editions">Limited Editions</a>
          <a href="/vintage">Vintage</a>
          <a href="/project-watches">Project Watches</a>
          <a href="/sell">Sell Your Branded Watch</a>
          <a href="/sell/intake">Watch Intake Form</a>
        </div>
      </div>
    </footer>
  );
}
