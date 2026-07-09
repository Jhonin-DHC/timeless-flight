import Link from "next/link";

const resourceLinks = [
  { href: "/resources/blogs", label: "Blogs" },
  { href: "/resources/videos", label: "Videos" },
  { href: "/resources/legal", label: "Legal" }
];

export default function ResourcesIndexPage() {
  return (
    <section className="space-y-6">
      <h1 className="section-title">Resources</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {resourceLinks.map((link) => (
          <Link key={link.href} href={link.href} className="glass-card text-lg font-medium hover:border-[var(--brand-a)]">
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
