import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("installed NextAuth exposes only Google with canonical callback URLs and no session", async ({ request }) => {
  const providers = await request.get("/api/auth/providers");
  expect(providers.status()).toBe(200);
  expect(await providers.json()).toEqual({ google: { id: "google", name: "Google", type: "oauth", signinUrl: "http://127.0.0.1:3101/api/auth/signin/google", callbackUrl: "http://127.0.0.1:3101/api/auth/callback/google" } });
  expect(providers.headers()["cache-control"]).toContain("private, no-store");
  const session = await request.get("/api/auth/session"); expect(session.status()).toBe(200); expect(await session.json()).toEqual({});
  const csrf = await request.get("/api/auth/csrf"); expect(csrf.status()).toBe(200);
  const cookies = (await request.storageState()).cookies;
  expect(cookies.some(cookie => cookie.name === "next-auth.csrf-token" && cookie.httpOnly && cookie.sameSite === "Lax")).toBe(true);
  expect(cookies.some(cookie => cookie.name === "daylight.signin-limiter" && cookie.httpOnly && cookie.sameSite === "Lax")).toBe(true);
});

test("protocol rejects authorization overrides, forged limiter, cross-origin and oversized bodies", async ({ request }) => {
  const origin = "http://127.0.0.1:3101";
  for (const query of ["scope=contacts", "access_type=offline", "redirect_uri=https://attacker.invalid"]) {
    const response = await request.post(`/api/auth/signin/google?${query}`, { headers: { origin }, form: { csrfToken: "invalid" } }); expect(response.status()).toBe(400);
  }
  const fresh = await request.post("/api/auth/signin/google", { headers: { origin, cookie: "daylight.signin-limiter=forged" }, form: { csrfToken: "invalid" } }); expect(fresh.status()).toBe(403);
  const cross = await request.post("/api/auth/signout", { headers: { origin: "https://attacker.invalid" }, form: { json: "true" } }); expect(cross.status()).toBe(403);
  const oversized = await request.post("/api/auth/signout", { headers: { origin, "content-type": "application/json" }, data: "x".repeat(16_385) }); expect(oversized.status()).toBe(400);
});

test("library-owned sign-out requires CSRF and clears an invalid session cookie", async ({ request }) => {
  const origin = "http://127.0.0.1:3101";
  const invalid = await request.post("/api/auth/signout", { headers: { origin }, form: { json: "true", callbackUrl: "/signin" } });
  expect((await invalid.json()).url).toContain("csrf=true");
  expect(invalid.headers()["set-cookie"] ?? "").not.toContain("next-auth.session-token=;");
  const csrf = await request.get("/api/auth/csrf");
  const { csrfToken } = await csrf.json();
  const existingCookies = (await request.storageState()).cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");
  const signedOut = await request.post("/api/auth/signout", { headers: { origin, cookie: `${existingCookies}; next-auth.session-token=invalid-synthetic-session` }, form: { json: "true", csrfToken, callbackUrl: "/signin" } });
  expect(signedOut.status()).toBe(200); expect((await signedOut.json()).url).toBe(`${origin}/signin`);
  expect((signedOut.headers()["set-cookie"] ?? "").includes("next-auth.session-token=;")).toBe(true);
});

test("configured sign-in shows retry after service failure without navigating or claiming an account", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/signin");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: "docs/evidence/signin-configured-390.png", fullPage: true });
  await page.route("**/api/auth/signin/google", route => route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ error: { code: "RATE_LIMITED" } }) }));
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Wait a minute");
  await expect(page).toHaveURL(/\/signin$/);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
  await page.screenshot({ path: "docs/evidence/signin-retry-390.png", fullPage: true });
  await page.unroute("**/api/auth/signin/google");
  await page.route("**/api/auth/csrf", route => route.abort());
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible(); await expect(page).toHaveURL(/\/signin$/);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});
