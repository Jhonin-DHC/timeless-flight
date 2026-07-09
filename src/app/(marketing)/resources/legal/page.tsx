export default function LegalPage() {
  return (
    <section className="space-y-6">
      <h1 className="section-title">Legal Resources</h1>
      <div className="glass-card space-y-3">
        <h2 className="text-xl font-semibold">Terms and Conditions</h2>
        <p className="text-sm text-[var(--muted)]">All listings are subject to availability, verification, and final invoicing in GHL.</p>
      </div>
      <div className="glass-card space-y-3">
        <h2 className="text-xl font-semibold">Privacy Policy</h2>
        <p className="text-sm text-[var(--muted)]">Customer information collected during checkout is handled through secure third-party payment channels.</p>
      </div>
    </section>
  );
}
