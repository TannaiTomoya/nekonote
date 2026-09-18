export const CATEGORIES = [
  ["housing", "住居"],
  ["food", "食"],
  ["comm", "通信"],
  ["transit", "交通"],
  ["medical", "医療"],
  ["joy", "たのしみ"],
  ["other", "その他"],
] as const;
export type Category = (typeof CATEGORIES)[number][0];
export type Mood = 1 | 2 | 3 | 4 | 5;
export type DailyLog = { id: string; date: string; mood: Mood; note: string };
export type Transaction = {
  id: string;
  date: string;
  kind: "income" | "expense";
  category: Category;
  amount: number;
  memo: string;
};
export type Recurring = {
  id: string;
  name: string;
  amount: number;
  day: number;
  active: boolean;
};
export type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  kind: "care" | "payment" | "other";
  careId?: string;
  memo: string;
};
export type Care = {
  id: string;
  name: string;
  memo: string;
  nextVisit: string;
  lat?: number;
  lng?: number;
};
export type Settings = {
  stimulus: 1 | 2 | 3;
  trigger: string;
  notify: boolean;
  lastOpened: string | null;
  onboarded: boolean;
};
export type Data = {
  version: 1;
  logs: DailyLog[];
  transactions: Transaction[];
  recurring: Recurring[];
  events: Event[];
  care: Care[];
  settings: Settings;
  drafts: Record<string, Record<string, string>>;
};
export const STORAGE_KEY = "nekonote.v1";
export const emptyData = (): Data => ({
  version: 1,
  logs: [],
  transactions: [],
  recurring: [],
  events: [],
  care: [],
  settings: {
    stimulus: 2,
    trigger: "",
    notify: false,
    lastOpened: null,
    onboarded: false,
  },
  drafts: {},
});
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dateObject(date: string) {
  return new Date(`${date}T12:00:00`);
}
export function addDays(date: string, amount: number) {
  const d = dateObject(date);
  d.setDate(d.getDate() + amount);
  return localDate(d);
}
export function dayDiff(a: string, b: string) {
  return Math.round(
    (Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000,
  );
}
export function validDate(d: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !Number.isNaN(dateObject(d).valueOf()) &&
    localDate(dateObject(d)) === d
  );
}
export function shouldWelcome(last: string | null, today: string) {
  return !!last && validDate(last) && dayDiff(today, last) >= 3;
}
export function monthSummary(t: Transaction[], date = localDate()) {
  const month = date.slice(0, 7);
  const rows = t.filter((r) => r.date.startsWith(month));
  const income = rows
    .filter((r) => r.kind === "income")
    .reduce((s, r) => s + r.amount, 0);
  const expense = rows
    .filter((r) => r.kind === "expense")
    .reduce((s, r) => s + r.amount, 0);
  return { income, expense, remaining: income - expense };
}
export function paymentDate(year: number, month: number, day: number) {
  return localDate(
    new Date(
      year,
      month,
      Math.min(day, new Date(year, month + 1, 0).getDate()),
      12,
    ),
  );
}
export function upcomingPayments(rows: Recurring[], today = localDate()) {
  const d = dateObject(today);
  return rows
    .filter((r) => r.active)
    .map((r) => {
      let date = paymentDate(d.getFullYear(), d.getMonth(), r.day);
      if (date < today)
        date = paymentDate(d.getFullYear(), d.getMonth() + 1, r.day);
      return { ...r, date };
    })
    .filter((r) => dayDiff(r.date, today) <= 3)
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function recoveryEvidence(logs: DailyLog[], today = localDate()) {
  const rows = logs
    .filter((l) => l.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const recent = rows.filter((l) => l.date >= addDays(today, -6));
  if (recent.length < 3 || rows.length < 10) return null;
  const average = (items: DailyLog[]) =>
    items.reduce((s, l) => s + l.mood, 0) / items.length;
  const base = average(rows),
    current = average(recent);
  if (current >= base) return null;
  // Only consecutive recorded days establish a recovery interval; gaps are not inferred.
  const past = rows.filter((l) => l.date < addDays(today, -6));
  for (let i = past.length - 2; i >= 0; i--) {
    if (past[i].mood > current) continue;
    for (let j = i + 1; j < past.length; j++) {
      if (dayDiff(past[j].date, past[j - 1].date) !== 1) break;
      if (past[j].mood >= base)
        return {
          start: past[i].date,
          end: past[j].date,
          days: dayDiff(past[j].date, past[i].date),
        };
    }
  }
  return null;
}
export function safetyLinkNeeded(note: string) {
  return /死にたい|消えたい|自殺|自分を傷つけ|生きていたくない/.test(note);
}
export const yen = (value: number) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
export const dateLabel = (date: string) =>
  dateObject(date).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
export const categoryLabel = (category: Category) =>
  CATEGORIES.find((c) => c[0] === category)?.[1] || "その他";
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return (
    '"' +
    (/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
    '"'
  );
}
export function exportCsv(data: Data) {
  const rows: unknown[][] = [
    [
      "種別",
      "日付",
      "名称・分類",
      "金額",
      "気分",
      "メモ",
      "時刻",
      "次回予約日",
      "緯度",
      "経度",
    ],
    ...data.logs.map((r) => ["気分", r.date, "", "", r.mood, r.note]),
    ...data.transactions.map((r) => [
      r.kind === "income" ? "収入" : "支出",
      r.date,
      categoryLabel(r.category),
      r.amount,
      "",
      r.memo,
    ]),
    ...data.events.map((r) => [
      "予定",
      r.date,
      r.title,
      "",
      "",
      r.memo,
      r.time,
    ]),
    ...data.recurring.map((r) => [
      "固定費",
      `毎月${r.day}日`,
      r.name,
      r.amount,
      "",
      r.active ? "有効" : "停止",
    ]),
    ...data.care.map((r) => [
      "通院先",
      "",
      r.name,
      "",
      "",
      r.memo,
      "",
      r.nextVisit,
      r.lat,
      r.lng,
    ]),
  ];
  return "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
