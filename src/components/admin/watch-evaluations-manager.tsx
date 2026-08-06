"use client";

import { FormEvent, useEffect, useState } from "react";

type WatchStatus = "draft" | "evaluating" | "offered" | "bought" | "passed";

interface CompRow {
  ebayItemId: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  itemWebUrl: string;
  imageUrl?: string;
  sellerUsername?: string;
}

interface WatchRow {
  _id: string;
  displayName: string;
  brand: string;
  model: string;
  referenceNumber: string;
  year?: number;
  serialNumber?: string;
  movementType?: string;
  caseSizeMm?: number;
  caseMaterial?: string;
  dialColor?: string;
  braceletType?: string;
  condition: string;
  boxIncluded: boolean;
  papersIncluded: boolean;
  lastServiceYear?: number;
  knownIssues?: string;
  notes?: string;
  photoUrls?: string[];
  source: string;
  offerPriceUsd?: number;
  targetSellPriceUsd?: number;
  costBasisUsd?: number;
  status: WatchStatus;
  searchKeywords?: string;
  marketplaceId?: string;
  lastEvaluatedAt?: string;
  compsCount?: number;
  compsMinUsd?: number;
  compsMaxUsd?: number;
  compsAvgUsd?: number;
  compsMedianUsd?: number;
  estimatedLowUsd?: number;
  estimatedHighUsd?: number;
  estimatedMidUsd?: number;
  comps?: CompRow[];
  lastSoldPriceUsd?: number;
  lastSoldDate?: string;
  lastSoldSource?: string;
  lastSoldUrl?: string;
  authorizedDealerPriceUsd?: number;
  watchChartsEstimateUsd?: number;
  recentSoldVariant?: string;
  brandNewPremiumPct?: number;
  withoutBoxPapersPct?: number;
  marketVolatility?: number;
  riskScore?: number;
  riskScoreLabel?: string;
  salesVolume1Y?: number;
  medianDaysOnMarket?: number;
  importSource?: string;
}

const emptyForm = {
  displayName: "",
  brand: "",
  model: "",
  referenceNumber: "",
  year: "",
  serialNumber: "",
  movementType: "",
  caseSizeMm: "",
  caseMaterial: "",
  dialColor: "",
  braceletType: "",
  condition: "Excellent",
  boxIncluded: false,
  papersIncluded: false,
  lastServiceYear: "",
  knownIssues: "",
  notes: "",
  source: "manual",
  offerPriceUsd: "",
  targetSellPriceUsd: "",
  costBasisUsd: "",
  status: "draft" as WatchStatus,
  searchKeywords: "",
  marketplaceId: "EBAY_US",
  lastSoldPriceUsd: "",
  lastSoldDate: "",
  lastSoldSource: "",
  lastSoldUrl: "",
  authorizedDealerPriceUsd: "",
  watchChartsEstimateUsd: "",
  recentSoldVariant: "",
  brandNewPremiumPct: "",
  withoutBoxPapersPct: "",
  marketVolatility: "",
  riskScore: "",
  riskScoreLabel: "",
  salesVolume1Y: "",
  medianDaysOnMarket: ""
};

function money(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  return `$${Number(value).toLocaleString()}`;
}

function toPayload(form: typeof emptyForm) {
  const num = (value: string) => (value === "" ? undefined : Number(value));
  return {
    displayName: form.displayName,
    brand: form.brand,
    model: form.model,
    referenceNumber: form.referenceNumber,
    year: num(form.year),
    serialNumber: form.serialNumber,
    movementType: form.movementType,
    caseSizeMm: num(form.caseSizeMm),
    caseMaterial: form.caseMaterial,
    dialColor: form.dialColor,
    braceletType: form.braceletType,
    condition: form.condition,
    boxIncluded: form.boxIncluded,
    papersIncluded: form.papersIncluded,
    lastServiceYear: num(form.lastServiceYear),
    knownIssues: form.knownIssues,
    notes: form.notes,
    source: form.source,
    offerPriceUsd: num(form.offerPriceUsd),
    targetSellPriceUsd: num(form.targetSellPriceUsd),
    costBasisUsd: num(form.costBasisUsd),
    status: form.status,
    searchKeywords: form.searchKeywords,
    marketplaceId: form.marketplaceId,
    lastSoldPriceUsd: num(form.lastSoldPriceUsd),
    lastSoldDate: form.lastSoldDate || null,
    lastSoldSource: form.lastSoldSource,
    lastSoldUrl: form.lastSoldUrl,
    authorizedDealerPriceUsd: num(form.authorizedDealerPriceUsd),
    watchChartsEstimateUsd: num(form.watchChartsEstimateUsd),
    recentSoldVariant: form.recentSoldVariant,
    brandNewPremiumPct: num(form.brandNewPremiumPct),
    withoutBoxPapersPct: num(form.withoutBoxPapersPct),
    marketVolatility: num(form.marketVolatility),
    riskScore: num(form.riskScore),
    riskScoreLabel: form.riskScoreLabel,
    salesVolume1Y: num(form.salesVolume1Y),
    medianDaysOnMarket: num(form.medianDaysOnMarket)
  };
}

function pct(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function watchToForm(watch: WatchRow): typeof emptyForm {
  return {
    displayName: watch.displayName || "",
    brand: watch.brand || "",
    model: watch.model || "",
    referenceNumber: watch.referenceNumber || "",
    year: watch.year != null ? String(watch.year) : "",
    serialNumber: watch.serialNumber || "",
    movementType: watch.movementType || "",
    caseSizeMm: watch.caseSizeMm != null ? String(watch.caseSizeMm) : "",
    caseMaterial: watch.caseMaterial || "",
    dialColor: watch.dialColor || "",
    braceletType: watch.braceletType || "",
    condition: watch.condition || "Excellent",
    boxIncluded: Boolean(watch.boxIncluded),
    papersIncluded: Boolean(watch.papersIncluded),
    lastServiceYear: watch.lastServiceYear != null ? String(watch.lastServiceYear) : "",
    knownIssues: watch.knownIssues || "",
    notes: watch.notes || "",
    source: watch.source || "manual",
    offerPriceUsd: watch.offerPriceUsd != null ? String(watch.offerPriceUsd) : "",
    targetSellPriceUsd: watch.targetSellPriceUsd != null ? String(watch.targetSellPriceUsd) : "",
    costBasisUsd: watch.costBasisUsd != null ? String(watch.costBasisUsd) : "",
    status: watch.status || "draft",
    searchKeywords: watch.searchKeywords || "",
    marketplaceId: watch.marketplaceId || "EBAY_US",
    lastSoldPriceUsd: watch.lastSoldPriceUsd != null ? String(watch.lastSoldPriceUsd) : "",
    lastSoldDate: watch.lastSoldDate ? String(watch.lastSoldDate).slice(0, 10) : "",
    lastSoldSource: watch.lastSoldSource || "",
    lastSoldUrl: watch.lastSoldUrl || "",
    authorizedDealerPriceUsd:
      watch.authorizedDealerPriceUsd != null ? String(watch.authorizedDealerPriceUsd) : "",
    watchChartsEstimateUsd: watch.watchChartsEstimateUsd != null ? String(watch.watchChartsEstimateUsd) : "",
    recentSoldVariant: watch.recentSoldVariant || "",
    brandNewPremiumPct: watch.brandNewPremiumPct != null ? String(watch.brandNewPremiumPct) : "",
    withoutBoxPapersPct: watch.withoutBoxPapersPct != null ? String(watch.withoutBoxPapersPct) : "",
    marketVolatility: watch.marketVolatility != null ? String(watch.marketVolatility) : "",
    riskScore: watch.riskScore != null ? String(watch.riskScore) : "",
    riskScoreLabel: watch.riskScoreLabel || "",
    salesVolume1Y: watch.salesVolume1Y != null ? String(watch.salesVolume1Y) : "",
    medianDaysOnMarket: watch.medianDaysOnMarket != null ? String(watch.medianDaysOnMarket) : ""
  };
}

export function WatchEvaluationsManager() {
  const [watches, setWatches] = useState<WatchRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const selected = watches.find((watch) => watch._id === selectedId) ?? null;

  const load = async () => {
    const response = await fetch("/api/admin/watch-evaluations");
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to load watches.");
      return;
    }
    setWatches(payload.watches ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setStatus(null);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    if (!form.brand.trim()) {
      setError("Brand is required.");
      setSaving(false);
      return;
    }

    const response = await fetch(
      editingId ? `/api/admin/watch-evaluations/${editingId}` : "/api/admin/watch-evaluations",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form))
      }
    );
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? "Save failed.");
      return;
    }
    const savedId = payload.watch?._id as string | undefined;
    resetForm();
    await load();
    if (savedId) setSelectedId(savedId);
    setStatus(editingId ? "Watch updated." : "Watch saved.");
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this watch evaluation record?")) return;
    const response = await fetch(`/api/admin/watch-evaluations/${id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Delete failed.");
      return;
    }
    if (editingId === id) resetForm();
    if (selectedId === id) setSelectedId(null);
    await load();
  };

  const evaluate = async (id: string) => {
    setEvaluating(true);
    setError(null);
    setStatus("Running eBay comps…");
    const response = await fetch(`/api/admin/watch-evaluations/${id}/evaluate`, { method: "POST" });
    const payload = await response.json();
    setEvaluating(false);
    if (!response.ok) {
      setError(payload.error ?? "Evaluation failed.");
      setStatus(null);
      return;
    }
    await load();
    setSelectedId(id);
    setStatus(payload.note ?? "Evaluation complete.");
  };

  const field = (key: keyof typeof emptyForm, label: string, type = "text") => (
    <label className="block space-y-1 text-sm">
      <span>{label}</span>
      <input
        type={type}
        value={form[key] as string | number | boolean as string}
        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
        className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Watch Evaluation</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Save watches manually, then run eBay comps for estimated asking ranges. Last-sold fields can be entered
          manually until sold-comps API access is available.
        </p>
      </div>

      <form onSubmit={save} className="glass-card space-y-4">
        <h3 className="text-lg font-semibold">{editingId ? "Edit watch" : "Add watch"}</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {field("displayName", "Display name")}
          {field("brand", "Brand *")}
          {field("model", "Model / family")}
          {field("referenceNumber", "Reference number")}
          {field("year", "Year", "number")}
          {field("serialNumber", "Serial (private)")}
          <label className="block space-y-1 text-sm">
            <span>Movement</span>
            <select
              value={form.movementType}
              onChange={(event) => setForm((current) => ({ ...current, movementType: event.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
            >
              <option value="">—</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
              <option value="Quartz">Quartz</option>
              <option value="Other">Other</option>
            </select>
          </label>
          {field("caseSizeMm", "Case size (mm)", "number")}
          {field("caseMaterial", "Case material")}
          {field("dialColor", "Dial color")}
          {field("braceletType", "Bracelet / strap")}
          <label className="block space-y-1 text-sm">
            <span>Condition</span>
            <select
              value={form.condition}
              onChange={(event) => setForm((current) => ({ ...current, condition: event.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
            >
              {["New", "Excellent", "Very Good", "Good", "Fair", "Parts"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          {field("lastServiceYear", "Last service year", "number")}
          <label className="block space-y-1 text-sm">
            <span>Source</span>
            <select
              value={form.source}
              onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
            >
              <option value="manual">Manual</option>
              <option value="import">Import</option>
              <option value="buy">Buy</option>
              <option value="trade-in">Trade-in</option>
              <option value="sell-inquiry">Sell inquiry</option>
              <option value="consignment">Consignment</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value as WatchStatus }))
              }
              className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
            >
              <option value="draft">Draft</option>
              <option value="evaluating">Evaluating</option>
              <option value="offered">Offered</option>
              <option value="bought">Bought</option>
              <option value="passed">Passed</option>
            </select>
          </label>
          {field("offerPriceUsd", "Offer / buy price (USD)", "number")}
          {field("targetSellPriceUsd", "Target sell price (USD)", "number")}
          {field("costBasisUsd", "Cost basis (USD)", "number")}
          {field("searchKeywords", "eBay search keywords (optional)")}
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.boxIncluded}
              onChange={(event) => setForm((current) => ({ ...current, boxIncluded: event.target.checked }))}
            />
            Box included
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.papersIncluded}
              onChange={(event) => setForm((current) => ({ ...current, papersIncluded: event.target.checked }))}
            />
            Papers included
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span>Known issues</span>
          <textarea
            value={form.knownIssues}
            onChange={(event) => setForm((current) => ({ ...current, knownIssues: event.target.value }))}
            rows={2}
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            rows={2}
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
          />
        </label>

        <div className="rounded-xl border border-white/10 p-3 space-y-4">
          <p className="text-sm font-medium">Market database / WatchCharts</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {field("authorizedDealerPriceUsd", "Authorized dealer price (USD)", "number")}
            {field("watchChartsEstimateUsd", "WatchCharts pre-owned estimate (USD)", "number")}
            {field("recentSoldVariant", "Recent sold model / variant")}
            {field("brandNewPremiumPct", "Brand-new premium (decimal, e.g. 0.103)", "number")}
            {field("withoutBoxPapersPct", "Without box/papers impact (decimal)", "number")}
            {field("marketVolatility", "Market volatility", "number")}
            {field("riskScore", "Risk score (0–100)", "number")}
            {field("riskScoreLabel", "Risk score label")}
            {field("salesVolume1Y", "1Y sales volume", "number")}
            {field("medianDaysOnMarket", "Median days on market", "number")}
          </div>
          <p className="text-sm font-medium">Last sold</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {field("lastSoldPriceUsd", "Last sold price (USD)", "number")}
            {field("lastSoldDate", "Last sold date", "date")}
            {field("lastSoldSource", "Source (eBay, Chrono24…)")}
            {field("lastSoldUrl", "Sold listing URL")}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="btn-gradient-primary text-sm">
            {saving ? "Saving…" : editingId ? "Update watch" : "Save watch"}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className="btn-gradient-secondary text-sm">
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {status ? <p className="text-sm text-[var(--brand-c)]">{status}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Saved watches</h3>
          {watches.map((watch) => (
            <div key={watch._id} className="glass-card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button type="button" className="text-left" onClick={() => setSelectedId(watch._id)}>
                  <p className="font-medium">{watch.displayName}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {watch.brand}
                    {watch.referenceNumber ? ` · ${watch.referenceNumber}` : ""}
                    {watch.condition ? ` · ${watch.condition}` : ""} · {watch.status}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    WatchCharts {money(watch.watchChartsEstimateUsd)}
                    {watch.lastSoldPriceUsd != null ? ` · last sold ${money(watch.lastSoldPriceUsd)}` : ""}
                    {watch.compsCount
                      ? ` · eBay ${money(watch.estimatedLowUsd)}–${money(watch.estimatedHighUsd)}`
                      : ""}
                  </p>
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-gradient-primary text-sm"
                    disabled={evaluating}
                    onClick={() => void evaluate(watch._id)}
                  >
                    Evaluate
                  </button>
                  <button
                    type="button"
                    className="btn-gradient-secondary text-sm"
                    onClick={() => {
                      setEditingId(watch._id);
                      setForm(watchToForm(watch));
                      setSelectedId(watch._id);
                      setError(null);
                      setStatus(null);
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="text-sm text-red-300" onClick={() => void remove(watch._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {watches.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No watches yet. Add one above to start evaluating.</p>
          ) : null}
        </div>

        <div className="glass-card space-y-4">
          <h3 className="text-lg font-semibold">Evaluation detail</h3>
          {!selected ? (
            <p className="text-sm text-[var(--muted)]">Select a watch to view comps and estimates.</p>
          ) : (
            <>
              <div>
                <p className="font-medium">{selected.displayName}</p>
                <p className="text-sm text-[var(--muted)]">
                  Keywords: {selected.searchKeywords || "—"}
                  {selected.lastEvaluatedAt
                    ? ` · Evaluated ${new Date(selected.lastEvaluatedAt).toLocaleString()}`
                    : " · Not evaluated yet"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <p>Dealer price: {money(selected.authorizedDealerPriceUsd)}</p>
                <p>WatchCharts est.: {money(selected.watchChartsEstimateUsd)}</p>
                <p>Last sold: {money(selected.lastSoldPriceUsd)}</p>
                <p>
                  Last sold date:{" "}
                  {selected.lastSoldDate ? new Date(selected.lastSoldDate).toLocaleDateString() : "—"}
                </p>
                <p className="sm:col-span-2">Recent sold variant: {selected.recentSoldVariant || "—"}</p>
                <p>Brand-new premium: {pct(selected.brandNewPremiumPct)}</p>
                <p>W/o box & papers: {pct(selected.withoutBoxPapersPct)}</p>
                <p>Volatility: {pct(selected.marketVolatility)}</p>
                <p>Risk: {selected.riskScoreLabel || (selected.riskScore != null ? `${selected.riskScore}/100` : "—")}</p>
                <p>1Y sales volume: {selected.salesVolume1Y ?? "—"}</p>
                <p>Median days on market: {selected.medianDaysOnMarket ?? "—"}</p>
                <p>Your offer: {money(selected.offerPriceUsd)}</p>
                <p>Target sell: {money(selected.targetSellPriceUsd)}</p>
                <p>eBay comps: {selected.compsCount ?? 0}</p>
                <p>eBay min / max: {money(selected.compsMinUsd)} / {money(selected.compsMaxUsd)}</p>
                <p>eBay avg / median: {money(selected.compsAvgUsd)} / {money(selected.compsMedianUsd)}</p>
                <p>
                  eBay est. range: {money(selected.estimatedLowUsd)} – {money(selected.estimatedHighUsd)}
                </p>
              </div>
              <button
                type="button"
                className="btn-gradient-primary text-sm"
                disabled={evaluating}
                onClick={() => void evaluate(selected._id)}
              >
                {evaluating ? "Evaluating…" : "Re-run eBay evaluation"}
              </button>
              <div className="space-y-2">
                <p className="text-sm font-medium">Active comps (asking prices)</p>
                {(selected.comps ?? []).length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No comps saved yet.</p>
                ) : (
                  <div className="max-h-[420px] space-y-2 overflow-y-auto">
                    {selected.comps?.map((comp) => (
                      <a
                        key={comp.ebayItemId}
                        href={comp.itemWebUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex gap-3 rounded-xl border border-white/10 p-2 hover:bg-white/5"
                      >
                        {comp.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={comp.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                        ) : (
                          <div className="h-14 w-14 rounded-lg bg-white/10" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{comp.title}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {money(comp.price)} · {comp.condition}
                            {comp.sellerUsername ? ` · ${comp.sellerUsername}` : ""}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
