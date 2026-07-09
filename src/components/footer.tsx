export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 py-8 text-sm text-[var(--muted)]">
      <div className="container-shell flex flex-col justify-between gap-3 md:flex-row">
        <p>© {new Date().getFullYear()} Timeless Flight</p>
        <p>Future-ready for GHL storefront integration and managed checkout workflows.</p>
      </div>
    </footer>
  );
}
