"use client";

import { requestAuthRedirect } from "@/features/auth/protocol-client";
import { useState } from "react";
import { Button } from "../ui/button";

export function GoogleSignIn() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true); setError("");
    try { window.location.assign(await requestAuthRedirect("signin/google", "/app/today")); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not reach sign-in. Check your connection and try again."); setBusy(false); }
  }
  return <div><Button variant="secondary" disabled={busy} onClick={start}>{busy ? "Opening Google…" : "Continue with Google"}</Button>{error && <p role="alert">{error}</p>}</div>;
}

export function AccountActions() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function leave(everywhere = false) {
    setBusy(true); setError("");
    try {
      if (everywhere) {
        const response = await fetch("/api/v1/me/logout-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        if (!response.ok) throw new Error("Unable to sign out.");
      }
      window.location.assign(await requestAuthRedirect("signout", "/signin"));
    } catch { setError("Sign-out could not finish. Check your connection and retry."); setBusy(false); }
  }
  return <div className="account-actions"><Button disabled={busy} variant="secondary" onClick={() => leave()}>Sign out</Button><Button disabled={busy} variant="quiet" onClick={() => leave(true)}>Sign out of all sessions</Button>{error && <p role="alert">{error}</p>}</div>;
}
