"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Step = "items" | "contact" | "review" | "done";

interface SellFormState {
  email: string;
  description: string;
  photoUrls: string[];
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode: string;
  country: string;
  zipCode: string;
}

const initialState: SellFormState = {
  email: "",
  description: "",
  photoUrls: [],
  firstName: "",
  lastName: "",
  phone: "",
  phoneCountryCode: "+1",
  country: "United States",
  zipCode: ""
};

const stepLabels: Record<Exclude<Step, "done">, string> = {
  items: "1. Items",
  contact: "2. Contact",
  review: "3. Review"
};

export function SellIntakeForm() {
  const [step, setStep] = useState<Step>("items");
  const [form, setForm] = useState<SellFormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = 5 - form.photoUrls.length;
    if (remaining <= 0) {
      setError("You can upload a maximum of 5 photos.");
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    setError(null);
    const urls: string[] = [];
    for (const file of selected) {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/sell/uploads", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) {
        setUploading(false);
        setError(payload.error ?? `Could not upload ${file.name}.`);
        return;
      }
      urls.push(payload.url as string);
    }
    setForm((current) => ({ ...current, photoUrls: [...current.photoUrls, ...urls].slice(0, 5) }));
    setUploading(false);
    if (files.length > remaining) {
      setError(`Only ${remaining} more photo${remaining === 1 ? "" : "s"} could be added (max 5).`);
    }
  };

  const continueFromItems = () => {
    setError(null);
    if (!form.description.trim() && form.photoUrls.length === 0) {
      setError("Add a description or at least one photo to continue.");
      return;
    }
    setStep("contact");
  };

  const continueFromContact = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStep("review");
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/sell/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Submission failed.");
      return;
    }
    setStep("done");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-c)]">Sell your watch</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          <Link href="/sell" className="text-[var(--brand-a)]">
            We Buy Watches
          </Link>{" "}
          · Watch Intake Form
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--muted)]">
          {(Object.keys(stepLabels) as Array<keyof typeof stepLabels>).map((key, index, list) => (
            <span key={key} className="inline-flex items-center gap-2">
              <span className={step === key || (step === "done" && key === "review") ? "text-[var(--brand-a)]" : ""}>
                {stepLabels[key]}
              </span>
              {index < list.length - 1 ? <span>•</span> : null}
            </span>
          ))}
        </div>
      </div>

      {step === "items" ? (
        <section className="glass-panel space-y-6">
          <div>
            <h1 className="section-title text-center">Tell us about your items</h1>
            <p className="section-copy mt-3 text-center">
              Add descriptions and photos of each watch. Include front, back, clasp, and paperwork if available.
            </p>
          </div>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Describe your item(s)"
            rows={8}
            className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-sm"
          />
          <div>
            <p className="mb-3 text-sm font-medium">Add photos ({form.photoUrls.length}/5)</p>
            <div className="flex flex-wrap gap-3">
              {form.photoUrls.map((url) => (
                <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/15">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        photoUrls: current.photoUrls.filter((item) => item !== url)
                      }))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              {form.photoUrls.length < 5 ? (
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/25 text-xs text-[var(--muted)] hover:border-[var(--brand-a)]">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      void uploadPhotos(event.target.files);
                      event.target.value = "";
                    }}
                  />
                  {uploading ? "…" : "+ Photo"}
                </label>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button type="button" className="btn-gradient-primary" disabled={uploading} onClick={continueFromItems}>
              Continue
            </button>
            <p className="text-sm text-[var(--muted)]">
              Need help?{" "}
              <a href="mailto:concierge@listqik.com" className="text-[var(--brand-a)]">
                concierge@listqik.com
              </a>
            </p>
          </div>
        </section>
      ) : null}

      {step === "contact" ? (
        <form className="glass-panel space-y-6" onSubmit={continueFromContact}>
          <div>
            <h1 className="section-title text-center">Your contact details</h1>
            <p className="section-copy mt-3 text-center">All fields are required so we can follow up on your watch.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="text-[var(--muted)]">First name</span>
              <input
                required
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-[var(--muted)]">Last name</span>
              <input
                required
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
              />
            </label>
            <label className="space-y-1.5 text-sm md:col-span-2">
              <span className="text-[var(--muted)]">Email</span>
              <input
                required
                type="email"
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-[var(--muted)]">Mobile phone</span>
              <div className="flex gap-2">
                <select
                  className="max-w-[7rem] rounded-xl border border-white/15 bg-[#111a30] px-2 py-2"
                  value={form.phoneCountryCode}
                  onChange={(event) => setForm({ ...form, phoneCountryCode: event.target.value })}
                >
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+852">+852</option>
                  <option value="+63">+63</option>
                </select>
                <input
                  required
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </div>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-[var(--muted)]">Country</span>
              <select
                className="w-full rounded-xl border border-white/15 bg-[#111a30] px-3 py-2"
                value={form.country}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
              >
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Hong Kong</option>
                <option>Philippines</option>
                <option>Singapore</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm md:col-span-2">
              <span className="text-[var(--muted)]">Zip / Postal code</span>
              <input
                required
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
                value={form.zipCode}
                onChange={(event) => setForm({ ...form, zipCode: event.target.value })}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-gradient-secondary" onClick={() => setStep("items")}>
              Back
            </button>
            <button type="submit" className="btn-gradient-primary">
              Continue
            </button>
          </div>
        </form>
      ) : null}

      {step === "review" ? (
        <section className="space-y-6">
          <div className="text-center">
            <h1 className="section-title">You&apos;re almost done</h1>
            <p className="section-copy mt-3">Review your details, then submit your sell inquiry.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Contact</h2>
                <button type="button" className="text-sm text-[var(--brand-c)]" onClick={() => setStep("contact")}>
                  Edit
                </button>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Name</dt>
                  <dd>
                    {form.firstName} {form.lastName}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Email</dt>
                  <dd>{form.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Phone</dt>
                  <dd>
                    {form.phoneCountryCode} {form.phone}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Location</dt>
                  <dd>
                    {form.country} {form.zipCode}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="glass-card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Items</h2>
                <button type="button" className="text-sm text-[var(--brand-c)]" onClick={() => setStep("items")}>
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.photoUrls.map((url) => (
                  <div key={url} className="h-14 w-14 overflow-hidden rounded-lg border border-white/15">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
                {form.photoUrls.length === 0 ? <p className="text-sm text-[var(--muted)]">No photos</p> : null}
              </div>
              <p className="text-sm text-[var(--muted)]">{form.description || "No description"}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-gradient-secondary" onClick={() => setStep("contact")}>
              Back
            </button>
            <button type="button" className="btn-gradient-primary" disabled={busy} onClick={submit}>
              {busy ? "Submitting..." : "Submit"}
            </button>
          </div>
        </section>
      ) : null}

      {step === "done" ? (
        <section className="glass-panel space-y-5 text-center">
          <h1 className="section-title">Thank you</h1>
          <p className="section-copy">
            Your sell inquiry is in. We&apos;ll review your watch details and follow up at {form.email}.
          </p>
          <Link href="/" className="btn-gradient-primary inline-flex">
            Back to home
          </Link>
        </section>
      ) : null}

      {error ? <p className="text-center text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
