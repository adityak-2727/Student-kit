"use client";

// Official NextAuth REST protocol. The library validates CSRF/state/PKCE/nonce;
// this client checks HTTP success before it follows an authentication redirect.
export async function requestAuthRedirect(action: "signin/google" | "signout", callbackUrl: string) {
  const csrf = await fetch("/api/auth/csrf", { cache: "no-store" });
  if (!csrf.ok) throw new Error("Sign-in service unavailable.");
  const csrfData: unknown = await csrf.json();
  if (!csrfData || typeof csrfData !== "object" || !("csrfToken" in csrfData) || typeof csrfData.csrfToken !== "string") throw new Error("Sign-in service unavailable.");
  const response = await fetch(`/api/auth/${action}`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken: csrfData.csrfToken, callbackUrl, json: "true" }),
  });
  if (!response.ok) throw new Error(response.status === 429 ? "Too many sign-in attempts. Wait a minute and try again." : "The account service is unavailable. Try again shortly.");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("url" in result) || typeof result.url !== "string") throw new Error("The account service is unavailable.");
  const destination = new URL(result.url, location.origin);
  const ownSignIn = destination.origin === location.origin && destination.pathname === "/signin";
  if (action === "signout" ? !ownSignIn || destination.searchParams.has("csrf") : !(destination.protocol === "https:" && destination.hostname === "accounts.google.com") && !ownSignIn) throw new Error("The account service could not finish this request.");
  return destination.href;
}
