"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import {
  isComplimentaryShipping,
  isUsZip,
  quoteShipping,
  SHIPPING_LOCAL_USD,
  SHIPPING_OVERNIGHT_USD,
  SHIPPING_US_USD,
  type ShippingMethod
} from "@/lib/shipping";

interface AppliedCoupon {
  code: string;
  discountAmount: number;
  percentOff?: number;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [referralEmail, setReferralEmail] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [shippingLine1, setShippingLine1] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("ground");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const discount = appliedCoupon?.discountAmount ?? 0;
  const complimentaryShipping = isComplimentaryShipping(appliedCoupon?.percentOff ?? 0);
  const shippingQuote = useMemo(
    () =>
      isUsZip(shippingZip)
        ? quoteShipping(shippingZip, shippingMethod, appliedCoupon?.percentOff ?? 0)
        : null,
    [shippingZip, shippingMethod, appliedCoupon?.percentOff]
  );
  const shippingUsd = complimentaryShipping ? 0 : (shippingQuote?.amountUsd ?? 0);
  const total = useMemo(
    () => Math.max(0, subtotal - discount) + shippingUsd,
    [subtotal, discount, shippingUsd]
  );

  useEffect(() => {
    if (searchParams.get("canceled") === "1") {
      setInfoMessage("Checkout canceled. Your cart is still here when you’re ready to continue.");
    }
  }, [searchParams]);

  // Soft-capture abandoned carts: save when email looks valid (no verification).
  useEffect(() => {
    const email = customerEmail.trim().toLowerCase();
    const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!looksValid || items.length === 0) return;

    const timer = window.setTimeout(() => {
      void fetch("/api/cart/abandon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          customerName: customerName.trim(),
          items
        })
      }).catch(() => {
        // Non-blocking; checkout should still work if save fails.
      });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [customerEmail, customerName, items]);

  const applyCoupon = async () => {
    setErrorMessage(null);
    if (!couponInput.trim()) {
      setErrorMessage("Enter a coupon code before applying.");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const response = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput.trim().toUpperCase(),
          cartTotal: subtotal
        })
      });
      const result = await response.json();
      if (!response.ok || !result.valid) {
        throw new Error(result.error ?? "Failed to validate coupon.");
      }
      setAppliedCoupon({
        code: result.code,
        discountAmount: Number(result.discountAmount) || 0,
        percentOff: typeof result.percentOff === "number" ? result.percentOff : undefined
      });
      setCouponInput(result.code);
      if (typeof result.message === "string" && result.message) {
        setInfoMessage(result.message);
      }
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

  const submitCheckout = async (event?: FormEvent) => {
    event?.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    if (items.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }
    if (!customerEmail || !customerName) {
      setErrorMessage("Name and email are required.");
      return;
    }
    if (!shippingLine1.trim() || !shippingCity.trim() || !/^[A-Za-z]{2}$/.test(shippingState.trim())) {
      setErrorMessage("Enter a US shipping address (street, city, and 2-letter state).");
      return;
    }
    if (!isUsZip(shippingZip)) {
      setErrorMessage("Enter a 5-digit US ZIP so we can quote shipping.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerEmail,
          customerName,
          referralEmail: referralEmail || undefined,
          couponCode: appliedCoupon?.code,
          shippingLine1: shippingLine1.trim(),
          shippingCity: shippingCity.trim(),
          shippingState: shippingState.trim().toUpperCase(),
          shippingZip,
          shippingMethod
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Failed to start Stripe checkout.");
      }
      clearCart();
      window.location.assign(payload.url as string);
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
        Review your cart and continue to secure Stripe payment. We ship inside the US only from Plano, TX. Percent
        coupons apply to the watch subtotal; a 100% code also covers shipping.
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
          <p className="text-xs text-[var(--muted)]">
            Entering your email saves this cart so we can follow up if checkout is interrupted. No verification required.
          </p>
          <input
            value={referralEmail}
            onChange={(event) => setReferralEmail(event.target.value)}
            placeholder="Referral email (optional)"
            type="email"
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none ring-[var(--brand-a)] focus:ring-2"
          />

          <div className="space-y-3 rounded-xl border border-white/15 p-3">
            <h3 className="text-sm font-medium">US shipping address</h3>
            <input
              value={shippingLine1}
              onChange={(event) => setShippingLine1(event.target.value)}
              placeholder="Street address"
              autoComplete="shipping address-line1"
              className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none ring-[var(--brand-a)] focus:ring-2"
            />
            <div className="grid gap-2 sm:grid-cols-[1fr_5rem_6.5rem]">
              <input
                value={shippingCity}
                onChange={(event) => setShippingCity(event.target.value)}
                placeholder="City"
                autoComplete="shipping address-level2"
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none ring-[var(--brand-a)] focus:ring-2"
              />
              <input
                value={shippingState}
                onChange={(event) => setShippingState(event.target.value.toUpperCase().slice(0, 2))}
                placeholder="TX"
                autoComplete="shipping address-level1"
                maxLength={2}
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm uppercase outline-none ring-[var(--brand-a)] focus:ring-2"
              />
              <input
                value={shippingZip}
                onChange={(event) => setShippingZip(event.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="ZIP"
                inputMode="numeric"
                autoComplete="shipping postal-code"
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none ring-[var(--brand-a)] focus:ring-2"
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Shipping method</legend>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="shippingMethod"
                  checked={shippingMethod === "ground"}
                  onChange={() => setShippingMethod("ground")}
                  className="mt-1"
                />
                <span>
                  Insured ground — ${SHIPPING_LOCAL_USD} Plano / DFW, ${SHIPPING_US_USD} rest of US
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="shippingMethod"
                  checked={shippingMethod === "overnight"}
                  onChange={() => setShippingMethod("overnight")}
                  className="mt-1"
                />
                <span>Overnight insured — ${SHIPPING_OVERNIGHT_USD} anywhere in the US</span>
              </label>
            </fieldset>
            {complimentaryShipping ? (
              <p className="text-xs text-[var(--muted)]">100% coupon includes free shipping.</p>
            ) : shippingQuote ? (
              <p className="text-xs text-[var(--muted)]">{shippingQuote.label}</p>
            ) : (
              <p className="text-xs text-[var(--muted)]">Enter a ZIP to see the exact shipping fee.</p>
            )}
          </div>

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
              <span className="text-[var(--muted)]">
                Discount{appliedCoupon?.percentOff ? ` (${appliedCoupon.percentOff}%)` : ""}
              </span>
              <span>- ${discount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Shipping</span>
              <span>
                {complimentaryShipping
                  ? "Free"
                  : shippingQuote
                    ? `$${shippingUsd.toLocaleString()}`
                    : "Enter ZIP"}
              </span>
            </div>
            <div className="flex justify-between border-t border-white/15 pt-2 text-base font-semibold">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>

          {infoMessage ? <p className="text-sm text-[var(--brand-c)]">{infoMessage}</p> : null}
          {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}

          <button
            type="button"
            onClick={() => void submitCheckout()}
            disabled={isSubmitting || items.length === 0}
            className="btn-gradient-primary w-full text-sm"
          >
            {isSubmitting ? "Redirecting to Stripe..." : "Pay securely with Stripe"}
          </button>
        </aside>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <section className="glass-panel space-y-4">
          <h1 className="section-title">Checkout</h1>
          <p className="section-copy">Loading cart…</p>
        </section>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
