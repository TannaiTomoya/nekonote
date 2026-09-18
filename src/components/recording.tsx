"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useStore, useDraft } from "./store";
import { Icon, CatFace } from "./icons";
import { PageTitle, BackLink, Field, SafetyLink, Empty } from "./common";
import {
  localDate,
  validDate,
  dateLabel,
  monthSummary,
  yen,
  safetyLinkNeeded,
  CATEGORIES,
  type Mood,
  type Category,
} from "@/lib/domain";
export const moodNames = [
  "しんどい",
  "少し低め",
  "ふつう",
  "おだやか",
  "いい感じ",
];
function useRecordDate() {
  const query = useSearchParams();
  const d = query.get("date") || localDate();
  return validDate(d) && d <= localDate() ? d : localDate();
}
export function MoodPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (mood: Mood) => void;
}) {
  return (
    <div className="mood-picker" role="group" aria-label="いまの気分">
      {moodNames.map((name, i) => (
        <button
          key={name}
          type="button"
          aria-label={name}
          aria-pressed={value === i + 1}
          className={`mood-option mood-${i + 1} ${value === i + 1 ? "selected" : ""}`}
          onClick={() => onChange((i + 1) as Mood)}
        >
          <CatFace mood={i + 1} />
          <span>{name}</span>
        </button>
      ))}
    </div>
  );
}
export function Today() {
  const { data } = useStore();
  const date = useRecordDate(),
    today = localDate();
  const saved = data.logs.find((l) => l.date === date);
  const summary = monthSummary(data.transactions, date);
  const events = data.events
    .filter((e) => e.date >= date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2);
  const greeting =
    data.settings.trigger === "morning"
      ? "おはよう。"
      : data.settings.trigger === "before_sleep"
        ? "おやすみの、その前に。"
        : data.settings.trigger === "after_meal"
          ? "ごはんのあとに、ひと手間。"
          : data.settings.trigger === "after_bath"
            ? "おふろのあとに、ひと息。"
            : "きょうは、どんな日？";
  return (
    <>
      <PageTitle
        eyebrow={dateLabel(date)}
        title={date === today ? greeting : "この日の記録"}
        description="いまの気持ちを、そっと置いていこう。"
      />
      <section className="card mood-card">
        <div className="section-heading">
          <h2>
            <Icon name="sun" />
            いまの気分
          </h2>
          <span className="pill">2タップで記録</span>
        </div>
        <div className="mood-picker">
          {moodNames.map((name, i) => (
            <Link
              aria-label={`${name}を記録`}
              key={name}
              href={`/today/mood?date=${date}&mood=${i + 1}`}
              className={`mood-option mood-${i + 1} ${saved?.mood === i + 1 ? "selected" : ""}`}
            >
              <CatFace mood={i + 1} />
              <span>{name}</span>
            </Link>
          ))}
        </div>
        {saved ? (
          <div className="saved-note">
            <Icon name="check" size={16} />
            <span>この日の記録：{saved.note || moodNames[saved.mood - 1]}</span>
            <Link href={`/today/mood?date=${date}`}>編集</Link>
          </div>
        ) : (
          <p className="card-footnote">いちばん近い表情を、ひとつ。</p>
        )}
      </section>
      <div className="dashboard-grid">
        <section className="card money-card">
          <div className="section-heading">
            <h2>
              <Icon name="wallet" />
              おかねのこと
            </h2>
            <span className="muted">{Number(date.slice(5, 7))}月</span>
          </div>
          <Link className="summary-link" href="/money">
            <span>今月あといくら</span>
            <strong className={summary.remaining < 0 ? "low-balance" : ""}>
              {yen(summary.remaining)}
            </strong>
            <small>
              今月の収入 − 支出
              <Icon name="arrow" size={16} />
            </small>
          </Link>
          <Link className="button soft full" href={`/today/money?date=${date}`}>
            <Icon name="plus" size={18} />
            おかねをつける
          </Link>
        </section>
        <section className="card">
          <div className="section-heading">
            <h2>
              <Icon name="calendar" />
              これからの予定
            </h2>
            <Link className="small-link" href="/calendar">
              すべて
            </Link>
          </div>
          {events.length ? (
            events.map((e) => (
              <Link
                key={e.id}
                className="event-row"
                href={e.careId ? `/care/${e.careId}` : "/calendar"}
              >
                <div className="date-badge">
                  <small>{Number(e.date.slice(5, 7))}月</small>
                  <b>{Number(e.date.slice(8))}</b>
                </div>
                <div>
                  <strong>{e.title}</strong>
                  <small>{e.time || "時間の指定なし"}</small>
                </div>
                <Icon name="arrow" size={17} />
              </Link>
            ))
          ) : (
            <Empty icon="calendar">予定を、ここにひとつ。</Empty>
          )}
          <Link className="text-link" href="/care">
            <Icon name="care" size={17} />
            通院のこと
            <Icon name="arrow" size={16} />
          </Link>
        </section>
      </div>
      <div className="quiet-message">
        <Icon name="paw" size={22} />
        <span>
          書ける日も、書けない日も。
          <br />
          <strong>ここは、いつでも戻ってこられる場所。</strong>
        </span>
      </div>
    </>
  );
}
export function MoodForm() {
  const date = useRecordDate(),
    query = useSearchParams(),
    router = useRouter();
  const { data, update } = useStore();
  const saved = data.logs.find((l) => l.date === date);
  const selected = Number(query.get("mood"));
  const initial =
    selected >= 1 && selected <= 5
      ? String(selected)
      : String(saved?.mood || 0);
  const [draft, setDraft] = useDraft(`mood:${date}`, {
    mood: initial,
    note: saved?.note || "",
  });
  const [message, setMessage] = useState("");
  function save() {
    const mood = Number(draft.mood) as Mood;
    if (mood < 1 || mood > 5) {
      setMessage("近い表情をひとつ選んでください。");
      return;
    }
    const ok = update((d) => {
      const drafts = { ...d.drafts };
      delete drafts[`mood:${date}`];
      return {
        ...d,
        drafts,
        logs: [
          ...d.logs.filter((l) => l.date !== date),
          {
            id: saved?.id || crypto.randomUUID(),
            date,
            mood,
            note: draft.note.trim(),
          },
        ],
      };
    });
    if (ok) {
      if (navigator.onLine) router.push(`/today?date=${date}`);
      else location.assign(`/today?date=${date}`);
    }
  }
  return (
    <>
      <BackLink />
      <PageTitle
        eyebrow={dateLabel(date)}
        title="いまの気持ちを、ひとつ。"
        description="ことばにならなくても、そのままで。"
      />
      <section className="card form-card">
        <MoodPicker
          value={Number(draft.mood)}
          onChange={(mood) => setDraft({ mood: String(mood) })}
        />
        <Field label="ひとことメモ（任意）">
          <input
            aria-label="ひとことメモ"
            maxLength={200}
            placeholder="窓を開けたら、風がきもちよかった"
            value={draft.note}
            onChange={(e) => setDraft({ note: e.target.value })}
          />
        </Field>
        {safetyLinkNeeded(draft.note) && <SafetyLink />}
        <p className="muted small">
          <Icon name="check" size={14} />
          入力途中も、このブラウザに保存されます。
        </p>
        {message && <p role="alert">{message}</p>}
        <button className="button primary full" onClick={save}>
          保存する
          <Icon name="check" size={18} />
        </button>
      </section>
    </>
  );
}
export function MoneyForm() {
  const date = useRecordDate(),
    router = useRouter();
  const { update } = useStore();
  const [draft, setDraft] = useDraft(`money:${date}`, {
    amount: "",
    category: "other",
    kind: "expense",
    memo: "",
  });
  const [message, setMessage] = useState("");
  function save(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(draft.amount);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 999999999) {
      setMessage("金額は1〜999,999,999円の整数で入力してください。");
      return;
    }
    const ok = update((d) => {
      const drafts = { ...d.drafts };
      delete drafts[`money:${date}`];
      return {
        ...d,
        drafts,
        transactions: [
          ...d.transactions,
          {
            id: crypto.randomUUID(),
            date,
            kind: draft.kind as "income" | "expense",
            category: draft.category as Category,
            amount,
            memo: draft.memo.trim(),
          },
        ],
      };
    });
    if (ok) {
      if (navigator.onLine) router.push(`/today?date=${date}`);
      else location.assign(`/today?date=${date}`);
    }
  }
  return (
    <>
      <BackLink />
      <PageTitle
        eyebrow={dateLabel(date)}
        title="おかねをつける"
        description="金額と分類だけ。計算はおまかせ。"
      />
      <form className="card form-card" onSubmit={save}>
        <div className="segmented">
          {[
            ["expense", "支出"],
            ["income", "収入"],
          ].map(([k, l]) => (
            <button
              type="button"
              key={k}
              aria-pressed={draft.kind === k}
              className={draft.kind === k ? "selected" : ""}
              onClick={() => setDraft({ kind: k })}
            >
              {l}
            </button>
          ))}
        </div>
        <Field label="金額">
          <div className="amount-input">
            <span>¥</span>
            <input
              aria-label="金額"
              inputMode="numeric"
              type="number"
              min="1"
              max="999999999"
              step="1"
              required
              placeholder="0"
              value={draft.amount}
              onChange={(e) => setDraft({ amount: e.target.value })}
            />
          </div>
        </Field>
        <fieldset>
          <legend>分類</legend>
          <div className="category-picker">
            {CATEGORIES.map(([id, name]) => (
              <button
                type="button"
                key={id}
                aria-pressed={draft.category === id}
                className={draft.category === id ? "selected" : ""}
                onClick={() => setDraft({ category: id })}
              >
                {name}
              </button>
            ))}
          </div>
        </fieldset>
        <Field label="メモ（任意）">
          <input
            maxLength={200}
            value={draft.memo}
            onChange={(e) => setDraft({ memo: e.target.value })}
            placeholder="何に使った？"
          />
        </Field>
        {message && <p role="alert">{message}</p>}
        <button className="button primary full" type="submit">
          保存する
          <Icon name="check" size={18} />
        </button>
      </form>
    </>
  );
}
