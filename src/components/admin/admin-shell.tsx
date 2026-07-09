"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/search", label: "Search" },
  { href: "/admin/settings", label: "Settings" }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-c)]">Timeless Flight</p>
          <h1 className="mt-2 text-lg font-semibold">Admin</h1>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2 text-sm ${
                    active ? "bg-white/15 text-white" : "text-[var(--muted)] hover:bg-white/10"
                  }`}
                >
                  {item.label}
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
