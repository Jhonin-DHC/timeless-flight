import Link from "next/link";

export default function NotFound() {
  return (
    <section className="glass-panel space-y-4 text-center">
      <h1 className="section-title">Page not found</h1>
      <p className="section-copy">The page you are looking for is unavailable or may have moved.</p>
      <Link href="/" className="btn-gradient-primary inline-block">Return home</Link>
    </section>
  );
}
