import { test as base, expect, type Page } from "@playwright/test";
import {
  emptyData,
  localDate,
  addDays,
  STORAGE_KEY,
  type Data,
} from "../src/lib/domain";
export { expect };
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.removeItem("supabase.auth.token");
    });
    await use(page);
  },
});
export const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export function sample(): Data {
  const d = emptyData(),
    today = localDate();
  d.settings = { ...d.settings, onboarded: true, lastOpened: today };
  d.logs = Array.from({ length: 14 }, (_, i) => ({
    id: id(i + 1),
    date: addDays(today, i - 13),
    mood: ([3, 2, 2, 3, 4, 3, 4, 4, 3, 4, 3, 4, 3, 4] as const)[i],
    note: i === 13 ? "窓を開けたら、風がきもちよかった" : "",
  })).filter((_, i) => ![2, 5, 9].includes(i));
  d.transactions = [
    {
      id: id(21),
      date: today.slice(0, 7) + "-01",
      kind: "income",
      category: "other",
      amount: 180000,
      memo: "今月の収入",
    },
    {
      id: id(22),
      date: today,
      kind: "expense",
      category: "housing",
      amount: 65000,
      memo: "家賃",
    },
    {
      id: id(23),
      date: today,
      kind: "expense",
      category: "food",
      amount: 12300,
      memo: "食費",
    },
    {
      id: id(24),
      date: today,
      kind: "expense",
      category: "comm",
      amount: 4500,
      memo: "通信費",
    },
  ];
  d.care = [
    {
      id: id(31),
      name: "いつものクリニック",
      memo: "最近の睡眠について話す",
      nextVisit: addDays(today, 3),
    },
  ];
  d.events = [
    {
      id: id(32),
      title: "いつものクリニック",
      date: addDays(today, 3),
      time: "14:00",
      kind: "care",
      careId: id(31),
      memo: "",
    },
    {
      id: id(33),
      title: "おさんぽの予定",
      date: addDays(today, 5),
      time: "10:00",
      kind: "other",
      memo: "",
    },
  ];
  return d;
}
export async function seed(page: Page, data: Data = sample()) {
  await page.goto("/today");
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value: data },
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "きょうは、どんな日？" }),
  ).toBeVisible();
}
