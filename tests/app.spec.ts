import { test, expect, seed, sample } from "./fixtures";
import { emptyData, localDate, addDays, STORAGE_KEY } from "../src/lib/domain";
import AxeBuilder from "@axe-core/playwright";
test("mood saves with two taps from home, survives reload, and drafts survive navigation", async ({
  page,
}) => {
  const d = sample();
  d.logs = [];
  await seed(page, d);
  await page.getByRole("link", { name: "おだやかを記録" }).click();
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  await expect(page.getByText("この日の記録：おだやか")).toBeVisible();
  await page.reload();
  await expect(page.getByText("この日の記録：おだやか")).toBeVisible();
  await page.getByRole("link", { name: "編集", exact: true }).click();
  await page.getByLabel("ひとことメモ", { exact: true }).fill("途中のメモ");
  await page.getByRole("link", { name: "きょうへ戻る" }).click();
  await page.getByRole("link", { name: "編集", exact: true }).click();
  await expect(page.getByLabel("ひとことメモ", { exact: true })).toHaveValue(
    "途中のメモ",
  );
  await page.screenshot({ path: "artifacts/01-mood.png" });
});
test("income, expense, automatic balance and delete undo", async ({ page }) => {
  const d = emptyData();
  d.settings = { ...d.settings, onboarded: true, lastOpened: localDate() };
  await seed(page, d);
  await page.goto("/today/money");
  await page.getByRole("button", { name: "収入", exact: true }).click();
  await page.getByLabel("金額", { exact: true }).fill("10000");
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  await page.goto("/today/money");
  await page.getByLabel("金額", { exact: true }).fill("850");
  await page.getByRole("button", { name: "食", exact: true }).click();
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  await page.goto("/money");
  await expect(page.getByText("￥9,150", { exact: true })).toBeVisible();
  await page.getByLabel("食の記録を削除").click();
  await expect(
    page.getByText("￥10,000", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "元に戻す" }).click();
  await expect(page.getByText("￥9,150", { exact: true })).toBeVisible();
  await page.screenshot({ path: "artifacts/02-money.png" });
});
test("recurring payment, calendar and care reservation are connected", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/money/recurring");
  await page.getByLabel("名前", { exact: true }).fill("家賃");
  await page.getByLabel("金額（円）").fill("65000");
  await page.getByLabel("毎月の支払日").fill("31");
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  await expect(page.getByText("毎月31日 · 表示する")).toBeVisible();
  await page.goto("/care");
  await page.getByLabel("医療機関の名前").fill("テスト通院先");
  await page.getByRole("button", { name: "登録する" }).click();
  await page.getByRole("link", { name: /テスト通院先/ }).click();
  await page.getByLabel("次回の予約日").fill(localDate());
  await page.getByRole("button", { name: "保存してカレンダーへ" }).click();
  await expect(page).toHaveURL(/\/calendar$/);
  await expect(
    page.locator(".event-row").getByText("テスト通院先", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/03-calendar.png" });
});
test("welcome activates from any app route, never shows elapsed days, dismisses and preserves history", async ({
  page,
}) => {
  const d = sample();
  d.settings.lastOpened = addDays(localDate(), -5);
  await page.goto("/today");
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: d },
  );
  await page.goto("/money");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("おかえりなさい");
  await expect(dialog).not.toContainText("5日");
  await dialog.getByRole("button", { name: "あとで" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("家賃", { exact: true })).toBeVisible();
});
test("settings, JSON export, low stimulus and offline input", async ({
  page,
  context,
}) => {
  await seed(page);
  await page.goto("/settings");
  await page.getByRole("button", { name: "ひかえめ", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-stimulus", "1");
  await page.getByLabel("ひらくきっかけ").selectOption("morning");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  await expect((await download).suggestedFilename()).toMatch(
    /nekonote.*\.json/,
  );
  await page.goto("/today/mood");
  await context.setOffline(true);
  await page.getByRole("button", { name: "ふつう", exact: true }).click();
  await page
    .getByLabel("ひとことメモ", { exact: true })
    .fill("オフラインで入力");
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key) || "{}").logs?.some(
            (l: { note: string }) => l.note === "オフラインで入力",
          ),
        STORAGE_KEY,
      ),
    )
    .toBe(true);
  await context.setOffline(false);
  await page.waitForLoadState("domcontentloaded");
  await page.goto("/today");
  await expect(page.getByText("この日の記録：オフラインで入力")).toBeVisible();
});
test("mobile layouts, keyboard modal, safety link and no Three.js in the app", async ({
  page,
}) => {
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  for (const route of [
    "/today",
    "/today/mood",
    "/today/money",
    "/money",
    "/money/recurring",
    "/calendar",
    "/care",
    "/review",
    "/settings",
    "/support",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(urls.some((url) => /paw\.glb|draco_decoder/.test(url))).toBe(false);
  await page.goto("/today/mood");
  await page.getByLabel("ひとことメモ", { exact: true }).fill("消えたい");
  await expect(
    page.getByRole("link", { name: /厚生労働省の相談窓口/ }),
  ).toBeVisible();
  await page.getByLabel("ひとことメモ", { exact: true }).fill("");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/today");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
