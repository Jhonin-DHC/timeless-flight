"use client";

import { useEffect, useState } from "react";

interface AbandonedCartItem {
  productId: string;
  listingId?: string;
  name: string;
  priceUsd: number;
  quantity: number;
}

interface AbandonedCartRow {
  _id: string;
  email: string;
  customerName: string;
  items: AbandonedCartItem[];
  subtotalUsd: number;
  status: "open" | "recovered" | "dismissed";
  stripeSessionId?: string;
  lastActivityAt: string;
  createdAt: string;
  recoveredAt?: string;
  dismissedAt?: string;
  adminNotes?: string;
}

const STATUS_OPTIONS: Array<AbandonedCartRow["status"] | "all"> = ["open", "recovered", "dismissed", "all"];

export function AbandonedCartsManager() {
  const [carts, setCarts] = useState<AbandonedCartRow[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("open");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadList = async () => {
    setError(null);
    const response = await fetch(`/api/admin/abandoned-carts?status=${statusFilter}`);
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to load abandoned carts.");
      return;
    }
    setCarts(payload.carts ?? []);
    setOpenCount(payload.openCount ?? 0);
  };

  useEffect(() => {
    void loadList();
  }, [statusFilter]);

  const dismiss = async (id: string) => {
    setBusyId(id);
    setError(null);
    const response = await fetch(`/api/admin/abandoned-carts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" })
    });
    const payload = await response.json();
    setBusyId(null);
    if (!response.ok) {
      setError(payload.error ?? "Failed to dismiss cart.");
      return;
    }
    await loadList();
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Abandoned carts</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Captured when a shopper enters email on checkout (no verification). {openCount} currently open.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-xl px-3 py-1.5 text-sm ${
              statusFilter === status ? "bg-white/15 text-white" : "text-[var(--muted)] hover:bg-white/10"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="space-y-3">
        {carts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No carts for this filter.</p>
        ) : (
          carts.map((cart) => (
            <article key={cart._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{cart.customerName || "Name not provided"}</p>
                  <a href={`mailto:${cart.email}`} className="text-sm text-[var(--brand-c)]">
                    {cart.email}
                  </a>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Last activity {new Date(cart.lastActivityAt || cart.createdAt).toLocaleString()} ·{" "}
                    ${Number(cart.subtotalUsd || 0).toLocaleString()} · {cart.status}
                  </p>
                </div>
                {cart.status === "open" ? (
                  <button
                    type="button"
                    disabled={busyId === cart._id}
                    onClick={() => void dismiss(cart._id)}
                    className="btn-gradient-secondary text-xs"
                  >
                    {busyId === cart._id ? "Saving…" : "Dismiss"}
                  </button>
                ) : null}
              </div>
              <ul className="mt-3 space-y-1 text-sm text-[var(--muted)]">
                {cart.items.map((item) => (
                  <li key={`${cart._id}-${item.productId}`}>
                    {item.name} × {item.quantity} — ${Number(item.priceUsd).toLocaleString()}
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
