import { test, expect, seed } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
test("LP loads the compressed paw, screenshots and CTA without browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "途切れても、",
  );
  await expect(page.locator(".hero canvas")).toBeVisible();
  await expect
    .poll(() => requests.some((u) => u.includes("/models/paw.glb")))
    .toBe(true);
  await expect(page.locator(".hero .canvas-ready")).toHaveCount(1);
  await page.locator("#howto").scrollIntoViewIfNeeded();
  await expect(
    page.locator(".guide-grid .phone-preview img").first(),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".guide-grid .phone-preview img")
        .evaluateAll((imgs) =>
          imgs.every(
            (i) =>
              (i as HTMLImageElement).complete &&
              (i as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.screenshot({ path: "artifacts/lp-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
    })),
  ).toEqual([]);
  await page
    .getByRole("link", { name: "ネコのてをはじめる", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/today$/);
});
test("saved low-stimulus setting survives a cold LP load", async ({ page }) => {
  await seed(page);
  await page.goto("/settings");
  await page.getByRole("button", { name: /ひかえめ/ }).click();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-stimulus", "1");
  await expect(page.locator(".hero .paw-fallback")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});
test("LP respects reduced motion, keeps PNG fallback, and fits small screens", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".hero .paw-fallback")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(requests.some((u) => u.includes("/models/paw.glb"))).toBe(false);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/lp-mobile.png", fullPage: true });
});
