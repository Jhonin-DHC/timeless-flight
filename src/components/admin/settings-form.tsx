"use client";

import { useEffect, useState } from "react";

interface SettingsPayload {
  marketplaceId: string;
  searchRunsPerDay: number;
  shippingLocalUsd: number;
  shippingUsUsd: number;
  shippingOvernightUsd: number;
  ebayConfigured: boolean;
  ebayEnv?: "sandbox" | "production";
  mongoConfigured: boolean;
  r2Configured: boolean;
  emailConfigured?: boolean;
  sellNotifyEmails?: string[];
}

export function SettingsForm() {
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/settings")
      .then((response) => response.json())
      .then((payload) => setSettings(payload.settings));
  }, []);

  const save = async () => {
    if (!settings) return;
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketplaceId: settings.marketplaceId,
        searchRunsPerDay: settings.searchRunsPerDay,
        shippingLocalUsd: settings.shippingLocalUsd,
        shippingUsUsd: settings.shippingUsUsd,
        shippingOvernightUsd: settings.shippingOvernightUsd
      })
    });
    setMessage(response.ok ? "Settings saved." : "Failed to save settings.");
  };

  if (!settings) {
    return <p className="text-sm text-[var(--muted)]">Loading settings...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Settings</h2>
        <p className="section-copy">Configure search defaults and verify backend integrations.</p>
      </div>

      <div className="glass-card space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={settings.marketplaceId}
            onChange={(event) => setSettings({ ...settings, marketplaceId: event.target.value })}
            placeholder="Default marketplace ID"
            className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={settings.searchRunsPerDay}
            onChange={(event) => setSettings({ ...settings, searchRunsPerDay: Number(event.target.value) })}
            placeholder="Target search runs per day"
            className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-3 border-t border-white/10 pt-4">
          <h3 className="text-sm font-medium">US shipping fees</h3>
          <p className="text-xs text-[var(--muted)]">
            Checkout uses these amounts immediately. A 100% coupon still waives shipping; other percent codes apply to
            the watch subtotal only.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-xs text-[var(--muted)]">
              Plano / DFW ground
              <input
                type="number"
                min={0}
                step="0.01"
                value={settings.shippingLocalUsd}
                onChange={(event) =>
                  setSettings({ ...settings, shippingLocalUsd: Number(event.target.value) })
                }
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="space-y-1 text-xs text-[var(--muted)]">
              Rest of US ground
              <input
                type="number"
                min={0}
                step="0.01"
                value={settings.shippingUsUsd}
                onChange={(event) => setSettings({ ...settings, shippingUsUsd: Number(event.target.value) })}
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="space-y-1 text-xs text-[var(--muted)]">
              Overnight (US)
              <input
                type="number"
                min={0}
                step="0.01"
                value={settings.shippingOvernightUsd}
                onChange={(event) =>
                  setSettings({ ...settings, shippingOvernightUsd: Number(event.target.value) })
                }
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
              />
            </label>
          </div>
        </div>
        <button type="button" onClick={save} className="btn-gradient-primary text-sm">
          Save settings
        </button>
        {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      </div>

      <div className="glass-card space-y-2 text-sm">
        <p>MongoDB configured: {settings.mongoConfigured ? "Yes" : "No"}</p>
        <p>R2 image uploads configured: {settings.r2Configured ? "Yes" : "No"}</p>
        <p>SMTP email configured: {settings.emailConfigured ? "Yes" : "No"}</p>
        <p>
          Sell notify emails:{" "}
          {settings.sellNotifyEmails?.length ? settings.sellNotifyEmails.join(", ") : "Not set"}
        </p>
        <p>
          eBay API configured: {settings.ebayConfigured ? "Yes" : "No"}
          {settings.ebayConfigured && settings.ebayEnv ? ` (${settings.ebayEnv})` : ""}
        </p>
        <p className="text-[var(--muted)]">
          SMTP powers sell verification codes and team alerts on new /sell submissions. Set SELL_NOTIFY_EMAILS
          for internal recipients.
        </p>
      </div>
    </div>
  );
}
