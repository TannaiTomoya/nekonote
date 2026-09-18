import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shouldWelcome,
  paymentDate,
  upcomingPayments,
  monthSummary,
  recoveryEvidence,
  exportCsv,
  emptyData,
  addDays,
  validDate,
} from "../src/lib/domain";
test("welcome uses local calendar days, exactly three days, never initial or future", () => {
  assert.equal(shouldWelcome(null, "2026-09-18"), false);
  assert.equal(shouldWelcome("2026-09-16", "2026-09-18"), false);
  assert.equal(shouldWelcome("2026-09-15", "2026-09-18"), true);
  assert.equal(shouldWelcome("2026-10-01", "2026-09-18"), false);
});
test("monthly reminders clamp 31st to leap/non-leap February and cross year", () => {
  assert.equal(paymentDate(2024, 1, 31), "2024-02-29");
  assert.equal(paymentDate(2026, 1, 31), "2026-02-28");
  const rows = [{ id: "x", name: "家賃", amount: 100, day: 1, active: true }];
  assert.equal(upcomingPayments(rows, "2026-12-30")[0].date, "2027-01-01");
});
test("income-expense is calculated only within the chosen month", () => {
  const rows = [
    {
      id: "1",
      date: "2026-09-01",
      kind: "income" as const,
      amount: 1000,
      category: "other" as const,
      memo: "",
    },
    {
      id: "2",
      date: "2026-09-18",
      kind: "expense" as const,
      amount: 125,
      category: "food" as const,
      memo: "",
    },
    {
      id: "3",
      date: "2026-08-01",
      kind: "expense" as const,
      amount: 900,
      category: "food" as const,
      memo: "",
    },
  ];
  assert.deepEqual(monthSummary(rows, "2026-09-18"), {
    income: 1000,
    expense: 125,
    remaining: 875,
  });
});
test("dates validate and do not overflow the month", () => {
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2024-02-29"), true);
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});
test("recovery evidence is absent with sparse or nonconsecutive recovery data", () => {
  assert.equal(recoveryEvidence([], "2026-09-18"), null);
  const d = emptyData();
  d.logs = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    date: addDays("2026-09-01", i),
    mood: 5 as const,
    note: "",
  }));
  d.logs.push({ id: "low", date: "2026-09-17", mood: 1, note: "" });
  assert.equal(recoveryEvidence(d.logs, "2026-09-18"), null);
});
test("CSV protects formula injection and includes every user record category", () => {
  const d = emptyData();
  d.logs = [{ id: "a", date: "2026-09-18", mood: 3, note: "=SUM(1,2)" }];
  d.care = [{ id: "b", name: "通院先", memo: 'a"b', nextVisit: "2026-10-01" }];
  const csv = exportCsv(d);
  assert.ok(csv.includes("'=SUM(1,2)"));
  assert.ok(csv.includes('a""b'));
  assert.ok(csv.includes("通院先"));
});
