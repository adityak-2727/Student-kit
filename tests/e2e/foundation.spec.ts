import { expect, test } from "@playwright/test";

test("public health is liveness only", async ({ request }) => {
  const response = await request.get("/api/v1/health");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual({ data: { status: "ok" } });
});

for (const width of [320, 360, 390, 768, 1280, 1440]) {
  test(`foundation is honest and reflows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Student life");
    await expect(page.getByText("Google sign-in", { exact: true })).toBeVisible();
    await expect(page.getByText("Not available yet", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "View what’s available" }).click();
    await expect(page).toHaveURL(/#availability$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `docs/evidence/foundation-${width}.png`, fullPage: true });
  });
}

test("keyboard skip link and unavailable route have a way home", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  const response = await page.goto("/app/today");
  expect(response?.status()).toBe(404);
  await page.getByRole("link", { name: "Return to Daylight" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Student life");
});
