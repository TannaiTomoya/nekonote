"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore, useDraft } from "./store";
import { PageTitle, Field, Empty, BackLink } from "./common";
import { Icon } from "./icons";
import {
  localDate,
  monthSummary,
  yen,
  categoryLabel,
  dateLabel,
  CATEGORIES,
} from "@/lib/domain";
export function MoneySummary() {
  const { data } = useStore();
  const s = monthSummary(data.transactions);
  return (
    <div className="money-summary">
      <div>
        <span>{Number(localDate().slice(5, 7))}月・今月あといくら</span>
        <strong className={s.remaining < 0 ? "low-balance" : ""}>
          {yen(s.remaining)}
        </strong>
      </div>
      <div>
        <small>
          収入 {yen(s.income)}
          <br />
          支出 {yen(s.expense)}
        </small>
      </div>
    </div>
  );
}
export function Money() {
  const { data, update } = useStore();
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const rows = data.transactions
    .filter((r) => r.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date));
  const [removed, setRemoved] = useState<(typeof rows)[number] | null>(null);
  return (
    <>
      <PageTitle
        eyebrow="A LITTLE MONEY NOTE"
        title="おかねのこと"
        description="使った分も、入った分も。ひと目で。"
        action={
          <Link className="button primary" href="/today/money">
            <Icon name="plus" size={17} />
            つける
          </Link>
        }
      />
      <section className="card">
        <div className="list-heading">
          <h2>収支の記録</h2>
          <input
            aria-label="表示する月"
            type="month"
            style={{ width: 160 }}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        {rows.length ? (
          rows.map((r) => (
            <div className="transaction-row" key={r.id}>
              <div className="category-icon">
                <Icon
                  name={r.kind === "income" ? "plus" : "wallet"}
                  size={18}
                />
              </div>
              <div>
                <strong>{r.memo || categoryLabel(r.category)}</strong>
                <small>
                  {dateLabel(r.date)} · {categoryLabel(r.category)}
                </small>
              </div>
              <span className="amount">
                {r.kind === "income" ? "+" : "−"}
                {yen(r.amount)}
              </span>
              <button
                aria-label={`${r.memo || categoryLabel(r.category)}の記録を削除`}
                onClick={() => {
                  if (
                    update((d) => ({
                      ...d,
                      transactions: d.transactions.filter((t) => t.id !== r.id),
                    }))
                  )
                    setRemoved(r);
                }}
              >
                削除
              </button>
            </div>
          ))
        ) : (
          <Empty icon="wallet">この月のおかねの記録がここに並びます。</Empty>
        )}
        {removed && (
          <div className="notice" role="status">
            記録を削除しました。
            <button
              className="small-link"
              onClick={() => {
                update((d) => ({
                  ...d,
                  transactions: [...d.transactions, removed],
                }));
                setRemoved(null);
              }}
            >
              元に戻す
            </button>
          </div>
        )}
      </section>
      <Link
        className="link-card"
        style={{ marginTop: 24 }}
        href="/money/recurring"
      >
        <Icon name="calendar" />
        <div>
          <h2>まいつきの支払い</h2>
          <p>家賃・カード・サブスクの支払日</p>
        </div>
        <Icon name="arrow" />
      </Link>
    </>
  );
}
export function Recurring() {
  const { data, update } = useStore();
  const [draft, setDraft] = useDraft("recurring", {
    name: "",
    amount: "",
    day: "25",
  });
  const [message, setMessage] = useState("");
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(draft.amount),
      day = Number(draft.day);
    if (
      !Number.isSafeInteger(amount) ||
      amount < 1 ||
      amount > 999999999 ||
      !Number.isInteger(day) ||
      day < 1 ||
      day > 31
    )
      return;
    const ok = update((d) => ({
      ...d,
      recurring: [
        ...d.recurring,
        {
          id: crypto.randomUUID(),
          name: draft.name.trim(),
          amount,
          day,
          active: true,
        },
      ],
    }));
    if (ok) {
      setDraft({ name: "", amount: "", day: "25" });
      setMessage("保存しました。");
    }
  };
  return (
    <>
      <BackLink href="/money">おかねへ戻る</BackLink>
      <PageTitle
        eyebrow="MONTHLY PAYMENTS"
        title="まいつきの支払い"
        description="支払日が近づいたら、アプリの中でそっと表示。"
      />
      <div className="stack">
        <section className="card">
          {data.recurring.length ? (
            data.recurring.map((r) => (
              <div className="transaction-row" key={r.id}>
                <div className="category-icon">
                  <Icon name="calendar" size={20} />
                </div>
                <div>
                  <strong>{r.name}</strong>
                  <small>
                    毎月{r.day}日 · {r.active ? "表示する" : "おやすみ中"}
                  </small>
                </div>
                <span className="amount">{yen(r.amount)}</span>
                <button
                  className="small-link"
                  onClick={() =>
                    update((d) => ({
                      ...d,
                      recurring: d.recurring.map((x) =>
                        x.id === r.id ? { ...x, active: !x.active } : x,
                      ),
                    }))
                  }
                >
                  {r.active ? "停止" : "再開"}
                </button>
                <button
                  onClick={() =>
                    update((d) => ({
                      ...d,
                      recurring: d.recurring.filter((x) => x.id !== r.id),
                    }))
                  }
                  aria-label={`${r.name}を削除`}
                >
                  削除
                </button>
              </div>
            ))
          ) : (
            <Empty icon="calendar">決まった支払いを、ここに。</Empty>
          )}
          <p className="chart-caption">
            31日などがない月は、その月の最終日を支払日として表示します。収支への自動計上は行いません。
          </p>
        </section>
        <form className="card form-card full" onSubmit={save}>
          <h2 className="section-heading">支払いを追加</h2>
          <Field label="名前">
            <input
              required
              maxLength={80}
              value={draft.name}
              onChange={(e) => setDraft({ name: e.target.value })}
              placeholder="家賃"
            />
          </Field>
          <div className="row">
            <Field label="金額（円）">
              <input
                required
                type="number"
                min="1"
                max="999999999"
                step="1"
                inputMode="numeric"
                value={draft.amount}
                onChange={(e) => setDraft({ amount: e.target.value })}
              />
            </Field>
            <Field label="毎月の支払日">
              <input
                required
                type="number"
                min="1"
                max="31"
                step="1"
                value={draft.day}
                onChange={(e) => setDraft({ day: e.target.value })}
              />
            </Field>
          </div>
          <button className="button primary full">保存する</button>
          <p role="status" className="small">
            {message}
          </p>
        </form>
      </div>
    </>
  );
}
export function ExpenseBars() {
  const { data } = useStore();
  const month = localDate().slice(0, 7);
  const values = CATEGORIES.map(([key, name]) => ({
    name,
    value: data.transactions
      .filter(
        (r) =>
          r.kind === "expense" &&
          r.category === key &&
          r.date.startsWith(month),
      )
      .reduce((s, r) => s + r.amount, 0),
  }));
  const max = Math.max(...values.map((v) => v.value), 1);
  return (
    <div
      className="bar-chart"
      role="img"
      aria-label={values.map((v) => `${v.name} ${yen(v.value)}`).join("、")}
    >
      {values.map((v) => (
        <div key={v.name} className="bar-column">
          <span>{v.value ? yen(v.value) : ""}</span>
          <div style={{ height: `${(v.value / max) * 110}px` }} />
          <small>{v.name}</small>
        </div>
      ))}
    </div>
  );
}
