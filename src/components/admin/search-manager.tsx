"use client";

import { useEffect, useState } from "react";

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

const emptyQuery = {
  name: "",
  keywords: "",
  marketplaceId: "EBAY_US",
  minPrice: undefined as number | undefined,
  maxPrice: undefined as number | undefined,
  resultLimit: 50,
  enabled: true
};

export function SearchManager() {
  const [queries, setQueries] = useState<SearchQueryRow[]>([]);
  const [results, setResults] = useState<SearchResultRow[]>([]);
  const [form, setForm] = useState(emptyQuery);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);

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
  }, []);

  useEffect(() => {
    void (async () => {
      const response = await fetch(`/api/admin/search/results?onlyNew=${onlyNew}`);
      const payload = await response.json();
      if (response.ok) setResults(payload.results ?? []);
    })();
  }, [onlyNew]);

  const saveQuery = async () => {
    setError(null);
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
    setForm(emptyQuery);
    setEditingId(null);
    await loadQueries();
  };

  const runSearch = async (queryId?: string) => {
    setRunning(true);
    setError(null);
    const response = await fetch("/api/admin/search/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryId ? { queryId } : {})
    });
    const payload = await response.json();
    setRunning(false);
    if (!response.ok) {
      setError(payload.error ?? "Search failed.");
      return;
    }
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">eBay Search</h2>
          <p className="section-copy">Configure keyword watches and review matched listings.</p>
        </div>
        <button type="button" disabled={running} onClick={() => runSearch()} className="btn-gradient-primary text-sm">
          {running ? "Running..." : "Run all enabled searches"}
        </button>
      </div>

      <div className="glass-card grid gap-3 md:grid-cols-2">
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Query name (e.g. Rolex Steel Sports)"
          className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
        />
        <input
          value={form.keywords}
          onChange={(event) => setForm({ ...form, keywords: event.target.value })}
          placeholder='Keywords (e.g. Submariner 126610LN GMT Pepsi Batgirl)'
          className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm md:col-span-2"
        />
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
          Enabled
        </label>
        <button type="button" onClick={saveQuery} className="btn-gradient-secondary text-sm">
          {editingId ? "Update query" : "Add query"}
        </button>
      </div>

      <div className="space-y-3">
        {queries.map((query) => (
          <div key={query._id} className="glass-card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{query.name}</p>
              <p className="text-sm text-[var(--muted)]">{query.keywords}</p>
              <p className="text-xs text-[var(--muted)]">
                {query.enabled ? "Enabled" : "Disabled"}
                {query.lastRunAt ? ` • Last run ${new Date(query.lastRunAt).toLocaleString()}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-gradient-primary text-sm" onClick={() => runSearch(query._id)}>
                Run
              </button>
              <button
                type="button"
                className="btn-gradient-secondary text-sm"
                onClick={() => {
                  setEditingId(query._id);
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
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Search results</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyNew} onChange={(event) => setOnlyNew(event.target.checked)} />
            Show only new
          </label>
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
