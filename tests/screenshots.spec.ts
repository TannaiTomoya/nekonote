import { test, expect, seed, sample } from "./fixtures";
import { localDate, addDays, STORAGE_KEY } from "../src/lib/domain";
test("capture the remaining feature instructions", async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [name, route] of [
    ["today", "/today"],
    ["ledger", "/money"],
    ["recurring", "/money/recurring"],
    ["care", "/care"],
    ["review", "/review"],
    ["settings", "/settings"],
    ["support", "/support"],
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({ path: `public/guide/${name}.png` });
  }
  await page.goto("/care/00000000-0000-4000-8000-000000000031");
  await expect(page.locator("h1")).toHaveText("いつものクリニック");
  await page.screenshot({ path: "public/guide/care-detail.png" });
});
test("capture verified app screens for the LP guide", async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "public/guide/today-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/today/mood");
  await page.getByRole("button", { name: "おだやか", exact: true }).click();
  await page
    .getByLabel("ひとことメモ", { exact: true })
    .fill("風がきもちよかった");
  await page.screenshot({ path: "public/guide/mood.png" });
  await page.goto("/today/money");
  await page.getByLabel("金額", { exact: true }).fill("850");
  await page.getByRole("button", { name: "食", exact: true }).click();
  await page.screenshot({ path: "public/guide/money.png" });
  await page.goto("/calendar");
  await expect(page.locator("h1")).toBeVisible();
  await page.screenshot({ path: "public/guide/calendar.png" });
  const data = sample();
  data.settings.lastOpened = addDays(localDate(), -5);
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: data },
  );
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: "public/guide/welcome.png" });
});
