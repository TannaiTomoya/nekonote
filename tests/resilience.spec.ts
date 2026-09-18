import { test, expect, seed, sample } from "./fixtures";
import { STORAGE_KEY, addDays, localDate } from "../src/lib/domain";
test("calendar reminders and money trend show only recorded facts", async ({
  page,
}) => {
  const data = sample();
  data.events[0].date = addDays(localDate(), 1);
  await seed(page, data);
  await expect(
    page.getByRole("link", { name: "今日と明日の予定を確認" }),
  ).toContainText("いつものクリニック");
  await page.goto("/review");
  await expect(
    page.getByRole("heading", { name: "お金のうつりかわり" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /最近2週間のお金の推移/ }),
  ).toBeVisible();
  await page.getByText("日付ごとの金額を見る").click();
  await expect(page.getByText(/支出 ￥81,800/)).toBeVisible();
});
test("repeated money entry through client navigation starts with a clean draft", async ({
  page,
}) => {
  await seed(page);
  await page.getByRole("link", { name: "おかねをつける", exact: true }).click();
  await page.getByLabel("金額", { exact: true }).fill("777");
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  await expect(page).toHaveURL(/\/today\?/);
  await page.getByRole("link", { name: "おかねをつける", exact: true }).click();
  await expect(page.getByLabel("金額", { exact: true })).toHaveValue("");
});
test("cold reload of a visited input page works offline after worker installation", async ({
  page,
  context,
}) => {
  await seed(page);
  await page.goto("/today/mood");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "いまの気持ちを、ひとつ。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ふつう", exact: true }).click();
  await page
    .getByLabel("ひとことメモ", { exact: true })
    .fill("再読み込みしても保存");
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  await expect(
    page.getByText("この日の記録：再読み込みしても保存"),
  ).toBeVisible();
  await context.setOffline(false);
});
test("local delete clears records, and damaged storage is not overwritten", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/settings");
  await page
    .getByRole("button", { name: "全データを削除する", exact: true })
    .click();
  const data = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "{}"),
    STORAGE_KEY,
  );
  expect(data.logs).toEqual([]);
  expect(data.transactions).toEqual([]);
  await page.getByRole("button", { name: "あとで", exact: true }).click();
  await page.evaluate(
    (key) => localStorage.setItem(key, "broken backup"),
    STORAGE_KEY,
  );
  await page.reload();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "保存データを読み込めませんでした" }),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY),
  ).toBe("broken backup");
});
