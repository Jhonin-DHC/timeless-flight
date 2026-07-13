"use client";

import { useEffect, useState } from "react";
import { CUSTOM_PRESET_ID, SEARCH_PRESETS } from "@/data/search-presets";

interface SearchQueryRow {
  _id: string;
  name: string;
  keywords: string;
  marketplaceId: string;
  minPrice?: number;
  maxPrice?: number;
  resultLimit: number;
  enabled: boolean;
  lastRunAt?: string;
}

interface SearchResultRow {
  _id: string;
  queryName: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  itemWebUrl: string;
  imageUrl: string;
  sellerUsername: string;
  isUnseen: boolean;
  lastSeenAt: string;
}

interface RunSummary {
  queryId: string;
  queryName: string;
  found: number;
  newCount: number;
  updatedCount: number;
}

const emptyQuery = {
  name: "",
  keywords: "",
  marketplaceId: "EBAY_US",
  minPrice: undefined as number | undefined,
  maxPrice: undefined as number | undefined,
  resultLimit: 50,
  enabled: true
};

function matchPresetId(name: string, keywords: string) {
  const match = SEARCH_PRESETS.find((preset) => preset.name === name || preset.keywords === keywords);
  return match?.id ?? CUSTOM_PRESET_ID;
}

export function SearchManager() {
  const [queries, setQueries] = useState<SearchQueryRow[]>([]);
  const [results, setResults] = useState<SearchResultRow[]>([]);
  const [form, setForm] = useState(emptyQuery);
  const [presetId, setPresetId] = useState(CUSTOM_PRESET_ID);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runningQueryId, setRunningQueryId] = useState<string | null>(null);
  const [onlyNew, setOnlyNew] = useState(false);
  const [ebayConfigured, setEbayConfigured] = useState<boolean | null>(null);
  const [ebayEnv, setEbayEnv] = useState<string | null>(null);

  const isCustom = presetId === CUSTOM_PRESET_ID;

  const applyPreset = (nextPresetId: string) => {
    setPresetId(nextPresetId);
    if (nextPresetId === CUSTOM_PRESET_ID) {
      setForm((current) => ({ ...current, name: "", keywords: "" }));
      return;
    }
    const preset = SEARCH_PRESETS.find((item) => item.id === nextPresetId);
    if (!preset) return;
    setForm((current) => ({
      ...current,
      name: preset.name,
      keywords: preset.keywords
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyQuery);
    setPresetId(CUSTOM_PRESET_ID);
  };

  const loadQueries = async () => {
    const response = await fetch("/api/admin/search-queries");
    const payload = await response.json();
    if (response.ok) setQueries(payload.queries ?? []);
  };

  const loadResults = async () => {
    const response = await fetch(`/api/admin/search/results?onlyNew=${onlyNew}`);
    const payload = await response.json();
    if (response.ok) setResults(payload.results ?? []);
  };

  useEffect(() => {
    void loadQueries();
    void fetch("/api/admin/settings")
      .then((response) => response.json())
      .then((payload) => {
        setEbayConfigured(Boolean(payload.settings?.ebayConfigured));
        setEbayEnv(payload.settings?.ebayEnv ?? null);
      })
      .catch(() => setEbayConfigured(false));
  }, []);

  useEffect(() => {
    void loadResults();
  }, [onlyNew]);

  const saveQuery = async () => {
    setError(null);
    setStatus(null);
    if (!form.name.trim() || !form.keywords.trim()) {
      setError("Name and keywords are required.");
      return;
    }

    const response = await fetch(editingId ? `/api/admin/search-queries/${editingId}` : "/api/admin/search-queries", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to save query.");
      return;
    }
    resetForm();
    setStatus(editingId ? "Query updated." : "Query added.");
    await loadQueries();
  };

  const deleteQuery = async (queryId: string) => {
    setError(null);
    const response = await fetch(`/api/admin/search-queries/${queryId}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to delete query.");
      return;
    }
    if (editingId === queryId) {
      resetForm();
    }
    setStatus("Query deleted.");
    await loadQueries();
  };

  const formatSummary = (summary: RunSummary[]) => {
    if (summary.length === 0) return "No enabled queries to run.";
    return summary
      .map((item) => `${item.queryName}: ${item.found} found (${item.newCount} new, ${item.updatedCount} updated)`)
      .join(" • ");
  };

  const runSearch = async (queryId?: string) => {
    setRunning(true);
    setRunningQueryId(queryId ?? "__all__");
    setError(null);
    setStatus(null);

    const response = await fetch("/api/admin/search/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryId ? { queryId } : {})
    });
    const payload = await response.json();
    setRunning(false);
    setRunningQueryId(null);

    if (!response.ok) {
      setError(payload.error ?? "Search failed.");
      return;
    }

    setStatus(formatSummary((payload.summary ?? []) as RunSummary[]));
    await loadQueries();
    await loadResults();
  };

  const markSeen = async (ids: string[]) => {
    await fetch("/api/admin/search/results", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, isUnseen: false })
    });
    await loadResults();
  };

  const markAllSeen = async () => {
    const unseenIds = results.filter((result) => result.isUnseen).map((result) => result._id);
    if (unseenIds.length === 0) return;
    await markSeen(unseenIds);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">eBay Search</h2>
          <p className="section-copy">
            Configure keyword watches and run searches manually. No automatic cron — click Run when you want fresh results.
          </p>
          {ebayConfigured !== null ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              eBay API: {ebayConfigured ? `configured (${ebayEnv ?? "production"})` : "not configured — set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET"}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={running || ebayConfigured === false}
          onClick={() => runSearch()}
          className="btn-gradient-primary text-sm disabled:opacity-50"
        >
          {runningQueryId === "__all__" ? "Running..." : "Run all enabled searches"}
        </button>
      </div>

      <div className="glass-card grid gap-3 md:grid-cols-2">
        <label className="md:col-span-2 space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Saved keyword set</span>
          <select
            value={presetId}
            onChange={(event) => applyPreset(event.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[var(--surface)] px-3 py-2 text-sm"
          >
            <option value={CUSTOM_PRESET_ID}>Custom — type your own</option>
            {SEARCH_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <input
          value={form.name}
          onChange={(event) => {
            setPresetId(CUSTOM_PRESET_ID);
            setForm({ ...form, name: event.target.value });
          }}
          placeholder="Query name (e.g. Rolex Steel Sports)"
          className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
          readOnly={!isCustom && !editingId}
        />
        <input
          value={form.keywords}
          onChange={(event) => {
            setPresetId(CUSTOM_PRESET_ID);
            setForm({ ...form, keywords: event.target.value });
          }}
          placeholder={isCustom ? "Type custom keywords…" : "Keywords from selected preset"}
          className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm md:col-span-2"
        />
        {!isCustom ? (
          <p className="md:col-span-2 text-xs text-[var(--muted)]">
            Preset selected. You can still tweak keywords before saving, or choose “Custom — type your own”.
          </p>
        ) : null}
        <input
          value={form.marketplaceId}
          onChange={(event) => setForm({ ...form, marketplaceId: event.target.value })}
          placeholder="Marketplace ID"
          className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={form.resultLimit}
          onChange={(event) => setForm({ ...form, resultLimit: Number(event.target.value) })}
          placeholder="Result limit"
          className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={form.minPrice ?? ""}
          onChange={(event) => setForm({ ...form, minPrice: event.target.value ? Number(event.target.value) : undefined })}
          placeholder="Min price"
          className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={form.maxPrice ?? ""}
          onChange={(event) => setForm({ ...form, maxPrice: event.target.value ? Number(event.target.value) : undefined })}
          placeholder="Max price"
          className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
          />
          Enabled (included in “Run all”)
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={saveQuery} className="btn-gradient-secondary text-sm">
            {editingId ? "Update query" : "Add query"}
          </button>
          {editingId ? (
            <button type="button" className="text-sm text-[var(--muted)]" onClick={resetForm}>
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {queries.map((query) => (
          <div key={query._id} className="glass-card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{query.name}</p>
              <p className="text-sm text-[var(--muted)]">{query.keywords}</p>
              <p className="text-xs text-[var(--muted)]">
                {query.enabled ? "Enabled" : "Disabled"}
                {typeof query.minPrice === "number" || typeof query.maxPrice === "number"
                  ? ` • $${query.minPrice ?? 0}–$${query.maxPrice ?? "∞"}`
                  : ""}
                {query.lastRunAt ? ` • Last run ${new Date(query.lastRunAt).toLocaleString()}` : " • Never run"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={running || ebayConfigured === false}
                className="btn-gradient-primary text-sm disabled:opacity-50"
                onClick={() => runSearch(query._id)}
              >
                {runningQueryId === query._id ? "Running..." : "Run"}
              </button>
              <button
                type="button"
                className="btn-gradient-secondary text-sm"
                onClick={() => {
                  setEditingId(query._id);
                  setPresetId(matchPresetId(query.name, query.keywords));
                  setForm({
                    name: query.name,
                    keywords: query.keywords,
                    marketplaceId: query.marketplaceId,
                    minPrice: query.minPrice,
                    maxPrice: query.maxPrice,
                    resultLimit: query.resultLimit,
                    enabled: query.enabled
                  });
                }}
              >
                Edit
              </button>
              <button type="button" className="text-sm text-red-300" onClick={() => deleteQuery(query._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {queries.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No search queries yet. Add one above, then click Run.</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {status ? <p className="text-sm text-[var(--brand-a)]">{status}</p> : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold">Search results</h3>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyNew} onChange={(event) => setOnlyNew(event.target.checked)} />
              Show only new
            </label>
            <button type="button" className="text-sm text-[var(--muted)]" onClick={markAllSeen}>
              Mark all seen
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {results.map((result) => (
            <article key={result._id} className="glass-card flex flex-wrap gap-4">
              {result.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.imageUrl} alt={result.title} className="h-20 w-20 rounded-lg object-cover" />
              ) : null}
              <div className="min-w-[240px] flex-1">
                <p className="font-medium">{result.title}</p>
                <p className="text-sm text-[var(--muted)]">
                  {result.queryName} • {result.condition} • {result.currency} {result.price.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--muted)]">Seller: {result.sellerUsername || "N/A"}</p>
                <a href={result.itemWebUrl} target="_blank" rel="noreferrer" className="text-sm text-[var(--brand-a)]">
                  View on eBay
                </a>
              </div>
              <div className="flex items-start gap-2">
                {result.isUnseen ? <span className="rounded-full bg-[var(--brand-c)]/20 px-2 py-1 text-xs">New</span> : null}
                {result.isUnseen ? (
                  <button type="button" className="text-xs text-[var(--muted)]" onClick={() => markSeen([result._id])}>
                    Mark seen
                  </button>
                ) : null}
              </div>
            </article>
          ))}
          {results.length === 0 ? <p className="text-sm text-[var(--muted)]">No results yet. Run a search query.</p> : null}
        </div>
      </section>
    </div>
  );
}
