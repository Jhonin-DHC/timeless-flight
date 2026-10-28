"use client";

import { useEffect, useState } from "react";
import { SHIPPING_CARRIER_LABELS, trackingUrl, type ShippingCarrier } from "@/lib/shipping";

interface OrderItem {
  productId: string;
  name: string;
  priceUsd: number;
  quantity: number;
}

interface OrderRow {
  _id: string;
  customerName: string;
  customerEmail: string;
  status: string;
  items: OrderItem[];
  subtotalUsd: number;
  discountUsd: number;
  shippingUsd: number;
  shippingLabel: string;
  insuranceUsd?: number;
  insuranceLabel?: string;
  shippingAddress?: {
    line1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  totalUsd: number;
  couponCode?: string;
  carrier?: string;
  trackingNumber?: string;
  shippedAt?: string;
  paidAt?: string;
  createdAt: string;
  shippingEmailSentAt?: string;
}

const STATUS_OPTIONS = ["paid", "pending", "shipped", "all"] as const;

export function AdminOrdersManager() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [paidCount, setPaidCount] = useState(0);
  const [awaitingShipCount, setAwaitingShipCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("paid");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { carrier: ShippingCarrier; trackingNumber: string }>>({});

  const loadList = async () => {
    setError(null);
    const response = await fetch(`/api/admin/orders?status=${statusFilter}`);
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to load orders.");
      return;
    }
    const nextOrders = (payload.orders ?? []) as OrderRow[];
    setOrders(nextOrders);
    setPaidCount(payload.paidCount ?? 0);
    setAwaitingShipCount(payload.awaitingShipCount ?? 0);
    setDrafts((current) => {
      const next = { ...current };
      for (const order of nextOrders) {
        if (!next[order._id]) {
          next[order._id] = {
            carrier: order.carrier === "fedex" ? "fedex" : "ups",
            trackingNumber: order.trackingNumber || ""
          };
        }
      }
      return next;
    });
  };

  useEffect(() => {
    void loadList();
  }, [statusFilter]);

  const saveTracking = async (id: string) => {
    const draft = drafts[id];
    setBusyId(id);
    setError(null);
    setStatus(null);
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        carrier: draft?.carrier || "ups",
        trackingNumber: draft?.trackingNumber || ""
      })
    });
    const payload = await response.json();
    setBusyId(null);
    if (!response.ok) {
      setError(payload.error ?? "Failed to save tracking.");
      return;
    }
    if (payload.emailSent) {
      setStatus("Tracking saved and emailed to the buyer.");
    } else {
      setStatus(payload.emailError || "Tracking saved, but the buyer email did not send.");
    }
    await loadList();
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {paidCount} paid · {awaitingShipCount} waiting for tracking. Saving a tracking number emails the buyer a UPS or
          FedEx link.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setStatusFilter(option)}
            className={`rounded-xl px-3 py-1.5 text-sm ${
              statusFilter === option ? "bg-white/15 text-white" : "text-[var(--muted)] hover:bg-white/10"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {status ? <p className="text-sm text-[var(--brand-c)]">{status}</p> : null}

      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No orders for this filter.</p>
        ) : (
          orders.map((order) => {
            const draft = drafts[order._id] || { carrier: "ups" as const, trackingNumber: "" };
            const address = order.shippingAddress;
            const trackHref =
              order.trackingNumber && order.carrier
                ? trackingUrl(order.carrier, order.trackingNumber)
                : "";
            return (
              <article key={order._id} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{order.customerName || "Name not provided"}</p>
                    <a href={`mailto:${order.customerEmail}`} className="text-sm text-[var(--brand-c)]">
                      {order.customerEmail}
                    </a>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {order.status}
                      {order.paidAt ? ` · paid ${new Date(order.paidAt).toLocaleString()}` : ""} · $
                      {Number(order.totalUsd || 0).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {order.shippingLabel || "Shipping"}
                    {order.insuranceUsd
                      ? ` · ${order.insuranceLabel || "Insurance"} $${Number(order.insuranceUsd).toLocaleString()}`
                      : ""}
                  </p>
                </div>

                <ul className="space-y-1 text-sm text-[var(--muted)]">
                  {order.items.map((item) => (
                    <li key={`${order._id}-${item.productId}`}>
                      {item.name} × {item.quantity} — ${Number(item.priceUsd).toLocaleString()}
                    </li>
                  ))}
                </ul>

                {address?.line1 ? (
                  <p className="text-sm text-[var(--muted)]">
                    {address.line1}, {address.city} {address.state} {address.postalCode}
                  </p>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-[8rem_1fr_auto]">
                  <select
                    value={draft.carrier}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [order._id]: {
                          ...draft,
                          carrier: event.target.value as ShippingCarrier
                        }
                      }))
                    }
                    className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
                  >
                    {Object.entries(SHIPPING_CARRIER_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={draft.trackingNumber}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [order._id]: { ...draft, trackingNumber: event.target.value }
                      }))
                    }
                    placeholder="Tracking number"
                    className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busyId === order._id || order.status !== "paid"}
                    onClick={() => void saveTracking(order._id)}
                    className="btn-gradient-primary text-sm"
                  >
                    {busyId === order._id ? "Saving…" : "Save & email"}
                  </button>
                </div>
                {trackHref ? (
                  <p className="text-xs text-[var(--muted)]">
                    <a href={trackHref} target="_blank" rel="noreferrer" className="text-[var(--brand-c)]">
                      Open tracking
                    </a>
                    {order.shippingEmailSentAt
                      ? ` · emailed ${new Date(order.shippingEmailSentAt).toLocaleString()}`
                      : ""}
                  </p>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
