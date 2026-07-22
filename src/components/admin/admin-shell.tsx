"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/videos", label: "Videos" },
  { href: "/admin/search", label: "Search" },
  { href: "/admin/sell-inquiries", label: "Sell inquiries" },
  { href: "/admin/settings", label: "Settings" }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    const loadAlerts = async () => {
      try {
        const response = await fetch("/api/admin/sell-inquiries/alerts");
        const payload = await response.json();
        if (active && response.ok) setUnreadCount(payload.unreadCount ?? 0);
      } catch {
        // ignore transient alert polling errors
      }
    };
    void loadAlerts();
    const timer = window.setInterval(loadAlerts, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-c)]">The Aviators Watch</p>
          <h1 className="mt-2 text-lg font-semibold">Admin</h1>
          {unreadCount > 0 ? (
            <p className="mt-3 rounded-xl border border-[var(--brand-c)]/30 bg-[var(--brand-c)]/10 px-3 py-2 text-xs text-[var(--brand-c)]">
              {unreadCount} new sell inquir{unreadCount === 1 ? "y" : "ies"}
            </p>
          ) : null}
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const showBadge = item.href === "/admin/sell-inquiries" && unreadCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                    active ? "bg-white/15 text-white" : "text-[var(--muted)] hover:bg-white/10"
                  }`}
                >
                  <span>{item.label}</span>
                  {showBadge ? (
                    <span className="rounded-full bg-[var(--brand-c)] px-2 py-0.5 text-[10px] font-semibold text-[#041018]">
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <button type="button" onClick={logout} className="btn-gradient-secondary mt-8 w-full text-sm">
            Log out
          </button>
        </aside>
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
