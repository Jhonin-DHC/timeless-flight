"use client";

import { useEffect, useState } from "react";
import { RemoteImage } from "@/components/remote-image";

interface SellReply {
  _id?: string;
  body: string;
  createdBy: string;
  createdAt: string;
}

interface SellInquiryRow {
  _id: string;
  email: string;
  description: string;
  photoUrls: string[];
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode: string;
  country: string;
  zipCode: string;
  status: "new" | "reviewed" | "replied" | "closed";
  isUnread: boolean;
  adminNotes: string;
  replies: SellReply[];
  createdAt: string;
}

const STATUS_OPTIONS: Array<SellInquiryRow["status"] | "all"> = ["all", "new", "reviewed", "replied", "closed"];

export function SellInquiriesManager() {
  const [inquiries, setInquiries] = useState<SellInquiryRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SellInquiryRow | null>(null);
  const [reply, setReply] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadList = async () => {
    const response = await fetch(`/api/admin/sell-inquiries?status=${statusFilter}`);
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to load inquiries.");
      return;
    }
    setInquiries(payload.inquiries ?? []);
    setUnreadCount(payload.unreadCount ?? 0);
  };

  const openInquiry = async (id: string) => {
    setSelectedId(id);
    setError(null);
    setStatus(null);
    const response = await fetch(`/api/admin/sell-inquiries/${id}`);
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to load inquiry.");
      return;
    }
    const inquiry = payload.inquiry as SellInquiryRow;
    setSelected(inquiry);
    setNotes(inquiry.adminNotes ?? "");
    setReply("");

    if (inquiry.isUnread) {
      await fetch(`/api/admin/sell-inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markRead: true })
      });
      await loadList();
      setSelected((current) =>
        current
          ? {
              ...current,
              isUnread: false,
              status: current.status === "new" ? "reviewed" : current.status
            }
          : current
      );
    }
  };

  useEffect(() => {
    void loadList();
  }, [statusFilter]);

  const saveNotes = async () => {
    if (!selectedId) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/admin/sell-inquiries/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes: notes })
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to save notes.");
      return;
    }
    setSelected(payload.inquiry);
    setStatus("Notes saved.");
    await loadList();
  };

  const sendReply = async () => {
    if (!selectedId || !reply.trim()) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/admin/sell-inquiries/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to save reply.");
      return;
    }
    setSelected(payload.inquiry);
    setReply("");
    setStatus("Reply saved on this inquiry.");
    await loadList();
  };

  const updateStatus = async (nextStatus: SellInquiryRow["status"]) => {
    if (!selectedId) return;
    setBusy(true);
    const response = await fetch(`/api/admin/sell-inquiries/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Failed to update status.");
      return;
    }
    setSelected(payload.inquiry);
    setStatus(`Marked as ${nextStatus}.`);
    await loadList();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/sell-inquiries/${id}`, { method: "DELETE" });
    if (selectedId === id) {
      setSelectedId(null);
      setSelected(null);
    }
    await loadList();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">Sell inquiries</h2>
          <p className="section-copy">Review seller submissions, photos, and reply notes.</p>
        </div>
        {unreadCount > 0 ? (
          <p className="rounded-full bg-[var(--brand-c)]/20 px-3 py-1 text-sm text-[var(--brand-c)]">
            {unreadCount} new alert{unreadCount === 1 ? "" : "s"}
          </p>
        ) : (
          <p className="text-sm text-[var(--muted)]">No new alerts</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setStatusFilter(option)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              statusFilter === option ? "bg-white/15 text-white" : "text-[var(--muted)] hover:bg-white/10"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <button
              key={inquiry._id}
              type="button"
              onClick={() => void openInquiry(inquiry._id)}
              className={`glass-card w-full text-left transition ${
                selectedId === inquiry._id ? "ring-1 ring-[var(--brand-a)]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">
                  {inquiry.firstName} {inquiry.lastName}
                </p>
                {inquiry.isUnread ? (
                  <span className="rounded-full bg-[var(--brand-c)]/25 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--brand-c)]">
                    New
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">{inquiry.email}</p>
              <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">
                {inquiry.description || "No description"}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {inquiry.status} • {new Date(inquiry.createdAt).toLocaleString()} • {inquiry.photoUrls?.length ?? 0}{" "}
                photo{(inquiry.photoUrls?.length ?? 0) === 1 ? "" : "s"}
              </p>
            </button>
          ))}
          {inquiries.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No sell inquiries yet.</p>
          ) : null}
        </div>

        <div className="glass-panel min-h-[420px]">
          {!selected ? (
            <p className="text-sm text-[var(--muted)]">Select an inquiry to view the full submission.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-semibold">
                    {selected.firstName} {selected.lastName}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">
                    Submitted {new Date(selected.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selected.status}
                    disabled={busy}
                    onChange={(event) => void updateStatus(event.target.value as SellInquiryRow["status"])}
                    className="rounded-xl border border-white/15 bg-[#111a30] px-3 py-2 text-sm"
                  >
                    <option value="new">new</option>
                    <option value="reviewed">reviewed</option>
                    <option value="replied">replied</option>
                    <option value="closed">closed</option>
                  </select>
                  <button type="button" className="text-sm text-red-300" onClick={() => void remove(selected._id)}>
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <p>
                  <span className="text-[var(--muted)]">Email:</span> {selected.email}
                </p>
                <p>
                  <span className="text-[var(--muted)]">Phone:</span> {selected.phoneCountryCode} {selected.phone}
                </p>
                <p>
                  <span className="text-[var(--muted)]">Country:</span> {selected.country}
                </p>
                <p>
                  <span className="text-[var(--muted)]">ZIP:</span> {selected.zipCode}
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Description</h4>
                <p className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed">
                  {selected.description || "No description provided."}
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Photos ({selected.photoUrls?.length ?? 0}/5)</h4>
                {selected.photoUrls?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {selected.photoUrls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="relative block h-40 overflow-hidden rounded-xl border border-white/10"
                      >
                        <RemoteImage src={url} alt="Seller upload" className="object-cover" sizes="240px" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted)]">No photos uploaded.</p>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Admin notes</h4>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
                  placeholder="Internal notes…"
                />
                <button type="button" className="btn-gradient-secondary text-sm" disabled={busy} onClick={saveNotes}>
                  Save notes
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Replies</h4>
                <div className="space-y-2">
                  {(selected.replies ?? []).map((item, index) => (
                    <div key={item._id ?? index} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                      <p className="whitespace-pre-wrap">{item.body}</p>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {item.createdBy} • {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {(selected.replies ?? []).length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">No replies yet.</p>
                  ) : null}
                </div>
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
                  placeholder="Write a reply to keep on this inquiry…"
                />
                <button type="button" className="btn-gradient-primary text-sm" disabled={busy || !reply.trim()} onClick={sendReply}>
                  Save reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {status ? <p className="text-sm text-[var(--brand-a)]">{status}</p> : null}
    </div>
  );
}
