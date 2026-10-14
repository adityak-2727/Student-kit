import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
  test(`synthetic workspace reflows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/dev/shell");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible();
    await expect(page.getByText("Synthetic preview.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
    await expect(page.getByRole("navigation", { name: width < 768 ? "Mobile navigation" : "Workspace navigation" })).toBeVisible();
    expect(errors).toEqual([]);
    const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(a11y.violations).toEqual([]);
    await page.screenshot({ path: `docs/evidence/shell-${width}.png`, fullPage: true });
    if (width < 768) await page.screenshot({ path: `docs/evidence/shell-${width}-viewport.png` });
  });
}

test("domain select and navigation keep the selected filter and date", async ({ page }) => {
  await page.goto("/dev/shell");
  const filter = page.getByRole("combobox", { name: "Workspace domain" });
  await filter.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("option", { name: "All domains", exact: true })).toBeFocused();
  await page.keyboard.press("f");
  await expect(page.getByRole("option", { name: "Fitness", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(filter).toContainText("Fitness");
  await expect(page.getByRole("button", { name: "Inspect Strength & mobility" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Inspect Work through/ })).toHaveCount(0);
  await page.getByRole("navigation", { name: "Workspace navigation" }).getByRole("button", { name: "Study", exact: true }).click();
  const self = page.getByRole("tab", { name: "Self-study", exact: true });
  await page.getByRole("tab", { name: "College study" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(self).toHaveAttribute("data-state", "active");
  await page.getByRole("navigation", { name: "Workspace navigation" }).getByRole("button", { name: "Today", exact: true }).click();
  await expect(filter).toContainText("Fitness");
  await expect(page.getByRole("button", { name: "Wednesday, 14 October 2026" })).toHaveAttribute("aria-pressed", "true");
});

test("date popover supports direct entry, dismissal, and focus return", async ({ page }) => {
  await page.goto("/dev/shell");
  const trigger = page.getByRole("button", { name: "Choose agenda date, 14 October 2026" });
  await trigger.click();
  await page.getByLabel("Agenda date", { exact: true }).fill("2026-10-15");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Choose agenda date, 15 October 2026" })).toBeFocused();
  await expect(page.getByText("No sample plans for this day or domain.", { exact: false })).toBeVisible();
});

test("editor validates, preserves a failed draft, applies only in memory, and returns focus", async ({ page }) => {
  await page.goto("/dev/shell");
  const add = page.getByRole("button", { name: "Add task to preview" });
  await add.click();
  const dialog = page.getByRole("dialog", { name: "Plan a preview task" });
  await expect(page.getByLabel("Task title")).toBeFocused();
  await page.getByRole("button", { name: "Apply to preview" }).click();
  await expect(page.getByText("Enter a title.", { exact: true })).toBeVisible();
  await page.getByLabel("Task title").fill("Synthetic draft — never persisted");
  await page.getByLabel("End time", { exact: true }).fill("08:00");
  await page.getByRole("button", { name: "Apply to preview" }).click();
  await expect(page.getByLabel("Task title")).toHaveValue("Synthetic draft — never persisted");
  await expect(page.getByLabel("End time", { exact: true })).toHaveAttribute("aria-invalid", "true");
  const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(a11y.violations).toEqual([]);
  await page.getByLabel("End time", { exact: true }).fill("09:45");
  await page.getByRole("button", { name: "Apply to preview" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(add).toBeFocused();
  await expect(page.getByRole("status")).toContainText("nothing was saved and no XP was awarded");
  await expect(page.getByRole("button", { name: "Inspect Synthetic draft — never persisted" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Inspect Synthetic draft — never persisted" }).locator(".domain-label")).toHaveText("study");
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(page.url()).toBe("http://127.0.0.1:3100/dev/shell");
  await page.reload();
  await expect(page.getByRole("button", { name: "Inspect Synthetic draft — never persisted" })).toHaveCount(0);
});

test("mobile More menu restores focus and display toggles change the agenda", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dev/shell");
  const more = page.getByRole("button", { name: "More", exact: true });
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Settings" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  await more.click();
  await page.getByRole("menuitem", { name: "Settings" }).click();
  await page.getByRole("switch", { name: "Compact agenda" }).click();
  await page.getByRole("switch", { name: "Show college source labels" }).click();
  await page.getByRole("button", { name: "Back to Today", exact: true }).click();
  await expect(page.locator(".agenda")).toHaveAttribute("data-compact", "true");
  await expect(page.locator(".task-source")).toHaveCount(0);
});

test("mobile editor remains usable in keyboard-reduced visual viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dev/shell");
  await page.getByRole("button", { name: "Add task to preview" }).click();
  await page.getByLabel("Task title").fill("Synthetic keyboard layout check");
  await page.setViewportSize({ width: 390, height: 420 });
  const dialog = page.getByRole("dialog", { name: "Plan a preview task" });
  const apply = page.getByRole("button", { name: "Apply to preview" });
  await expect(apply).toBeInViewport();
  const bounds = await dialog.boundingBox();
  expect(bounds?.height).toBeLessThanOrEqual(420);
  await page.getByLabel("End time", { exact: true }).focus();
  await expect(apply).toBeInViewport();
  await page.screenshot({ path: "docs/evidence/shell-editor-keyboard-space.png" });
  await apply.click();
  await expect(dialog).toHaveCount(0);
});

test("long titles, landscape, reduced motion, and loading/error/empty states reflow", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 360 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/shell");
  await page.getByRole("button", { name: "Add task to preview" }).click();
  await page.getByLabel("Task title").fill("S".repeat(160));
  await page.getByRole("button", { name: "Apply to preview" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const state = page.getByRole("combobox", { name: "Preview state" });
  for (const option of ["Loading sample", "Error sample", "Offline sample", "Empty sample", "Sample day"]) {
    await state.click();
    await page.getByRole("option", { name: option, exact: true }).click();
    await expect(page.getByText("Synthetic preview.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.screenshot({ path: "docs/evidence/shell-landscape.png", fullPage: true });
});

test("200% text size still reflows and preserves the editor action", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dev/shell");
  // Text is sized in rem, so doubling the root size also scales portalled controls.
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Add task to preview" }).click();
  expect(await page.getByLabel("Task title").evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBe(32);
  await expect(page.getByRole("button", { name: "Apply to preview" })).toBeInViewport();
  await page.screenshot({ path: "docs/evidence/shell-text-200.png" });
});

test("fonts load from the app and necessary control borders have sufficient contrast", async ({ page }) => {
  const fontUrls: string[] = [];
  page.on("request", (request) => { if (request.url().includes(".woff2")) fontUrls.push(request.url()); });
  await page.goto("/dev/shell");
  await page.evaluate(() => document.fonts.ready);
  expect(fontUrls.length).toBeGreaterThan(0);
  expect(fontUrls.every((url) => new URL(url).origin === "http://127.0.0.1:3100")).toBe(true);
  expect(await page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily)).toContain("Manrope Variable");
  const contrast = await page.getByRole("combobox", { name: "Workspace domain" }).evaluate((element) => {
    const style = getComputedStyle(element);
    function luminance(color: string) {
      const rgb = color.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? [];
      const linear = rgb.map((value) => { const v = value / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      return (linear[0] ?? 0) * .2126 + (linear[1] ?? 0) * .7152 + (linear[2] ?? 0) * .0722;
    }
    const a = luminance(style.borderTopColor), b = luminance(style.backgroundColor);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  });
  expect(contrast).toBeGreaterThanOrEqual(3);
});

test("mobile skip link is above chrome and modal focus stays contained", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/dev/shell");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  expect(await skip.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2) === element;
  })).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.getByRole("button", { name: "Add task to preview" }).click();
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  }
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press("Shift+Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Add task to preview" })).toBeFocused();
});

test("empty-state apply returns to a stable trigger and hidden scheduling errors cannot block inbox drafts", async ({ page }) => {
  await page.goto("/dev/shell");
  await page.getByRole("combobox", { name: "Preview state" }).click();
  await page.getByRole("option", { name: "Empty sample" }).click();
  await page.getByRole("button", { name: "Plan a preview task", exact: true }).click();
  await page.getByLabel("Task title").fill("Synthetic focus fallback check");
  await page.getByRole("button", { name: "Apply to preview" }).click();
  await expect(page.getByRole("button", { name: "Quick add preview task" })).toBeFocused();
  await page.getByRole("button", { name: "Inspect Strength & mobility" }).click();
  await page.getByLabel("Date", { exact: true }).fill("");
  await page.getByLabel("Start time", { exact: true }).fill("");
  await page.getByRole("switch", { name: "Schedule this draft" }).click();
  await page.getByRole("button", { name: "Apply to preview" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Quick add preview task" })).toBeFocused();
  await expect(page.locator(".inbox-section").getByRole("button", { name: /Strength & mobility/ })).toBeVisible();
});

test("completed sample keeps its schedule fixed and short tablet navigation scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 360 });
  await page.goto("/dev/shell");
  await page.getByRole("button", { name: /Inspect Work through integration/ }).click();
  await expect(page.getByRole("combobox", { name: "Domain", exact: true })).toBeDisabled();
  await expect(page.getByLabel("Date", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Task title")).toBeEditable();
  await page.keyboard.press("Escape");
  const settings = page.getByRole("navigation", { name: "Workspace navigation" }).getByRole("button", { name: "Settings" });
  await settings.focus();
  await expect(settings).toBeInViewport();
  await page.keyboard.press("Enter");
  const toggle = page.getByRole("switch", { name: "Compact agenda" });
  const bounds = await toggle.boundingBox();
  expect(bounds?.height).toBeGreaterThanOrEqual(44);
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-checked", "true");
});
