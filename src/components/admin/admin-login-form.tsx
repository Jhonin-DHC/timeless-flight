"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Login failed.");
      return;
    }

    router.push("/admin/listings");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="glass-panel mx-auto w-full max-w-md space-y-4">
      <h1 className="section-title">Admin Login</h1>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
        required
      />
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button type="submit" disabled={loading} className="btn-gradient-primary w-full text-sm">
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
