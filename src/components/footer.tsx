export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 py-8 text-sm text-[var(--muted)]">
      <div className="container-shell flex flex-col justify-between gap-3 md:flex-row">
        <p>© {new Date().getFullYear()} The Aviators Watch</p>
        <div className="flex flex-wrap gap-4">
          <a href="/sell">Sell Your Watch</a>
          <a href="/sell/intake">Watch Intake Form</a>
        </div>
      </div>
    </footer>
  );
}
