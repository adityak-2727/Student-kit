import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 360, 390, 768, 1280, 1440]) {
  test(`sign-in setup/error states are accessible at ${width}px`, async ({ page }) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/signin?error=OAuthCallback");
    await expect(page.getByRole("heading", { name: "Sign-in needs setup" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Sign-in could not finish");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `docs/evidence/signin-${width}.png`, fullPage: true });
  });
}

test("signed-out services, auth-disabled errors and private pages are never cached", async ({ page, request }) => {
  const me = await request.get("/api/v1/me?userId=other-account");
  expect(me.status()).toBe(401);
  expect(me.headers()["cache-control"]).toContain("private, no-store");
  expect((await me.json()).error.code).toBe("UNAUTHENTICATED");
  const disabled = await request.get("/api/auth/session");
  expect(disabled.status()).toBe(503);
  expect(disabled.headers()["cache-control"]).toContain("private, no-store");
  expect(await disabled.text()).not.toContain("MONGODB");
  const crossOrigin = await request.post("/api/v1/me/logout-all", { headers: { origin: "https://attacker.invalid", "content-type": "application/json" }, data: {} });
  expect(crossOrigin.status()).toBe(403);
  const spoofed = await request.post("/api/v1/me/logout-all", { headers: { origin: "http://localhost:3000", "content-type": "application/json" }, data: { userId: "other-account" } });
  expect(spoofed.status()).toBe(400);
  const correctShape = await request.post("/api/v1/me/logout-all", { headers: { origin: "http://localhost:3000", "content-type": "application/json" }, data: {} });
  expect(correctShape.status()).toBe(401);
  const response = await page.goto("/app/today");
  await expect(page).toHaveURL(/\/signin\?error=SessionRequired$/);
  expect(response?.headers()["cache-control"]).toContain("private, no-store");
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});

test("CSP uses fresh script nonces and does not reflect arbitrary provider errors", async ({ page, request }) => {
  const first = await request.get("/signin"); const second = await request.get("/signin");
  const csp = first.headers()["content-security-policy"]!;
  expect(csp).toContain("object-src 'none'"); expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("'strict-dynamic'"); expect(csp).not.toContain("'unsafe-eval'");
  expect(csp).not.toEqual(second.headers()["content-security-policy"]);
  await page.goto("/signin?error=sentinel-private-value&callbackUrl=https://attacker.invalid");
  await expect(page.getByRole("main").getByRole("alert")).not.toContainText("sentinel");
  const violations = await page.evaluate(() => [...document.scripts].filter(script => !script.nonce).length);
  expect(violations).toBe(0);
  await page.getByRole("link", { name: "Back to Daylight" }).click();
  await expect(page).toHaveURL(/\/$/);
});
