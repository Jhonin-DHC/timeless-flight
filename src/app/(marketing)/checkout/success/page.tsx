"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface SessionPayload {
  session?: {
    id: string;
    status: string | null;
    paymentStatus: string;
    customerEmail?: string | null;
    amountTotal: number | null;
    currency?: string | null;
  };
  order?: {
    id: string;
    status: string;
    customerName: string;
    customerEmail: string;
    items: Array<{ name: string; priceUsd: number; quantity: number }>;
    subtotalUsd: number;
    discountUsd: number;
    totalUsd: number;
  } | null;
  error?: string;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [payload, setPayload] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing checkout session.");
      return;
    }

    void fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const data = (await response.json()) as SessionPayload;
        if (!response.ok) throw new Error(data.error ?? "Could not load payment details.");
        setPayload(data);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load payment details.");
      });
  }, [sessionId]);

  if (error) {
    return (
      <section className="glass-panel space-y-4">
        <h1 className="section-title">Payment status</h1>
        <p className="text-sm text-red-300">{error}</p>
        <Link href="/checkout" className="btn-gradient-secondary inline-block text-sm">
          Back to checkout
        </Link>
      </section>
    );
  }

  if (!payload) {
    return (
      <section className="glass-panel space-y-4">
        <h1 className="section-title">Confirming payment…</h1>
        <p className="section-copy">Please wait while we verify your Stripe checkout.</p>
      </section>
    );
  }

  const paid =
    payload.session?.paymentStatus === "paid" ||
    payload.order?.status === "paid" ||
    payload.session?.status === "complete";

  return (
    <section className="glass-panel space-y-5">
      <h1 className="section-title">{paid ? "Payment successful" : "Checkout received"}</h1>
      <p className="section-copy max-w-2xl">
        {paid
          ? "Thank you for your purchase. A confirmation will arrive from Stripe to your email."
          : "Your checkout session was created. If payment is still processing, refresh in a moment."}
      </p>

      <div className="space-y-2 rounded-xl border border-white/15 p-4 text-sm">
        <p>
          <span className="text-[var(--muted)]">Email: </span>
          {payload.order?.customerEmail || payload.session?.customerEmail || "—"}
        </p>
        <p>
          <span className="text-[var(--muted)]">Total: </span>$
          {(payload.order?.totalUsd ?? payload.session?.amountTotal ?? 0).toLocaleString()}
        </p>
        <p>
          <span className="text-[var(--muted)]">Status: </span>
          {payload.order?.status || payload.session?.paymentStatus || "—"}
        </p>
      </div>

      {payload.order?.items?.length ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Items</h2>
          {payload.order.items.map((item) => (
            <p key={`${item.name}-${item.quantity}`} className="text-sm text-[var(--muted)]">
              {item.quantity} × {item.name} — ${item.priceUsd.toLocaleString()}
            </p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/listings" className="btn-gradient-primary text-sm">
          Continue shopping
        </Link>
        <Link href="/" className="btn-gradient-secondary text-sm">
          Back home
        </Link>
      </div>
    </section>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <section className="glass-panel space-y-4">
          <h1 className="section-title">Confirming payment…</h1>
        </section>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
