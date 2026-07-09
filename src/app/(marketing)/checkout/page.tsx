"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { createCheckout, validateCoupon } from "@/lib/storefront-api";

interface AppliedCoupon {
  code: string;
  discountAmount: number;
}

export default function CheckoutPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  const applyCoupon = async () => {
    setErrorMessage(null);
    if (!couponInput.trim()) {
      setErrorMessage("Enter a coupon code before applying.");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const result = await validateCoupon({
        code: couponInput.trim().toUpperCase(),
        cartTotal: subtotal,
        items: items.map((item) => ({ name: item.name, price: item.price, quantity: item.quantity })),
        customerEmail: customerEmail || undefined
      });
      setAppliedCoupon({ code: result.code, discountAmount: result.discountAmount });
      setCouponInput(result.code);
    } catch (error) {
      setAppliedCoupon(null);
      setErrorMessage(error instanceof Error ? error.message : "Failed to validate coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setErrorMessage(null);
  };

  const submitCheckout = async () => {
    setErrorMessage(null);
    if (items.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }
    if (!customerEmail || !customerName) {
      setErrorMessage("Name and email are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentUrl = await createCheckout({
        items,
        customerEmail,
        customerName,
        couponCode: appliedCoupon?.code,
        referralEmail: referralEmail || undefined
      });
      clearCart();
      window.location.assign(paymentUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="section-title">Checkout</h1>
      <p className="section-copy max-w-3xl">
        Apply a coupon and continue to secure GHL payment. The backend is the source of truth for coupon validity and final totals.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass-card space-y-4">
          <h2 className="text-xl font-semibold">Cart items</h2>
          {items.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Your cart is empty. Add a watch from Listings.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="rounded-xl border border-white/15 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-[var(--muted)]">${item.price.toLocaleString()} each</p>
                    </div>
                    <button type="button" onClick={() => removeItem(item.productId)} className="text-sm text-red-300">
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <label htmlFor={`qty-${item.productId}`} className="text-sm text-[var(--muted)]">
                      Qty
                    </label>
                    <input
                      id={`qty-${item.productId}`}
                      min={1}
                      type="number"
                      value={item.quantity}
                      onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                      className="w-20 rounded-lg border border-white/20 bg-transparent px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="glass-card space-y-4">
          <h2 className="text-xl font-semibold">Customer details</h2>
          <input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none ring-[var(--brand-a)] focus:ring-2"
          />
          <input
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            placeholder="Email address"
            type="email"
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none ring-[var(--brand-a)] focus:ring-2"
          />
          <input
            value={referralEmail}
            onChange={(event) => setReferralEmail(event.target.value)}
            placeholder="Referral email (optional)"
            type="email"
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none ring-[var(--brand-a)] focus:ring-2"
          />

          <div className="rounded-xl border border-white/15 p-3">
            <label htmlFor="coupon-code" className="mb-2 block text-sm font-medium">
              Coupon code
            </label>
            <div className="flex gap-2">
              <input
                id="coupon-code"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                placeholder="SAVE10"
                className="w-full rounded-lg border border-white/20 bg-transparent px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={isApplyingCoupon || items.length === 0}
                className="btn-gradient-secondary text-sm"
              >
                {isApplyingCoupon ? "Applying..." : "Apply"}
              </button>
            </div>
            {appliedCoupon ? (
              <button type="button" onClick={removeCoupon} className="mt-2 text-xs text-[var(--brand-c)]">
                Remove coupon ({appliedCoupon.code})
              </button>
            ) : null}
          </div>

          <div className="space-y-2 rounded-xl border border-white/15 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Subtotal</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Discount</span>
              <span>- ${discount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-white/15 pt-2 text-base font-semibold">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>

          {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}

          <button
            type="button"
            onClick={submitCheckout}
            disabled={isSubmitting || items.length === 0}
            className="btn-gradient-primary w-full text-sm"
          >
            {isSubmitting ? "Redirecting..." : "Proceed to payment"}
          </button>
        </aside>
      </div>
    </section>
  );
}
