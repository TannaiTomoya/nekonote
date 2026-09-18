"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore, useDraft } from "./store";
import { PageTitle, Field, Empty } from "./common";
import { Icon } from "./icons";
import {
  localDate,
  dateObject,
  dateLabel,
  paymentDate,
  type Event,
} from "@/lib/domain";
export function Calendar() {
  const { data, update } = useStore();
  const today = localDate();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useDraft("event", {
    title: "",
    time: "",
    kind: "other",
    memo: "",
  });
  const first = dateObject(`${month}-01`);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const payments = data.recurring
    .filter((r) => r.active)
    .map((r) => ({
      id: r.id,
      title: r.name,
      date: paymentDate(first.getFullYear(), first.getMonth(), r.day),
      time: "",
      kind: "payment",
      memo: "",
    }));
  const events = [...data.events, ...payments];
  function changeMonth(n: number) {
    const date = new Date(first.getFullYear(), first.getMonth() + n, 1, 12);
    setMonth(localDate(date).slice(0, 7));
  }
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    if (
      update((d) => ({
        ...d,
        events: [
          ...d.events,
          {
            id: crypto.randomUUID(),
            title: draft.title.trim(),
            date: selected,
            time: draft.time,
            kind: draft.kind as Event["kind"],
            memo: draft.memo,
          },
        ],
      }))
    ) {
      setDraft({ title: "", time: "", kind: "other", memo: "" });
      setShowForm(false);
    }
  };
  return (
    <>
      <PageTitle
        eyebrow="LIFE, AT YOUR OWN PACE"
        title="カレンダー"
        description="日々の記録と、これからの予定。"
      />
      <div className="dashboard-grid">
        <section className="card">
          <div className="month-nav">
            <button aria-label="前の月" onClick={() => changeMonth(-1)}>
              <Icon name="back" />
            </button>
            <strong>
              {first.getFullYear()}年 {first.getMonth() + 1}月
            </strong>
            <button aria-label="次の月" onClick={() => changeMonth(1)}>
              <Icon name="back" style={{ transform: "rotate(180deg)" }} />
            </button>
          </div>
          <div className="calendar-grid">
            {"日月火水木金土".split("").map((x) => (
              <span className="weekday" key={x}>
                {x}
              </span>
            ))}
            {Array.from({ length: first.getDay() }, (_, i) => (
              <span key={`space${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = `${month}-${String(i + 1).padStart(2, "0")}`;
              const log = data.logs.find((l) => l.date === date);
              return (
                <button
                  key={date}
                  aria-label={dateLabel(date)}
                  aria-pressed={selected === date}
                  onClick={() => setSelected(date)}
                  className={`day ${log ? "recorded" : ""} ${date === today ? "is-today" : ""} ${date === selected ? "chosen" : ""}`}
                >
                  <span>{i + 1}</span>
                  {events.some((e) => e.date === date) && <i />}
                </button>
              );
            })}
          </div>
          <div className="calendar-legend">
            <span />
            記録のある日
            <i />
            予定
          </div>
        </section>
        <section className="card">
          <div className="section-heading">
            <h2>{dateLabel(selected)}</h2>
          </div>
          {events.filter((e) => e.date === selected).length ? (
            events
              .filter((e) => e.date === selected)
              .map((e) => (
                <div className="event-row" key={e.id}>
                  <Icon
                    name={e.kind === "care" ? "care" : "calendar"}
                    size={18}
                  />
                  <div>
                    <strong>{e.title}</strong>
                    <small>{e.time || "時間の指定なし"}</small>
                  </div>
                  {data.events.some((x) => x.id === e.id) && (
                    <button
                      className="small-link"
                      onClick={() =>
                        update((d) => ({
                          ...d,
                          events: d.events.filter((x) => x.id !== e.id),
                        }))
                      }
                      aria-label={`${e.title}の予定を削除`}
                    >
                      削除
                    </button>
                  )}
                </div>
              ))
          ) : (
            <Empty icon="calendar">予定のない、余白の日。</Empty>
          )}
          <div className="calendar-detail">
            {selected <= today && (
              <Link
                className="button soft full"
                href={`/today?date=${selected}`}
              >
                この日の記録をひらく
                <Icon name="arrow" size={17} />
              </Link>
            )}
            <button
              className="button outline full"
              onClick={() => setShowForm(!showForm)}
            >
              <Icon name="plus" size={17} />
              予定を追加
            </button>
            <Link className="text-link" href="/care">
              <Icon name="care" size={18} />
              通院のこと
              <Icon name="arrow" size={16} />
            </Link>
          </div>
        </section>
      </div>
      {showForm && (
        <form
          className="card form-card"
          onSubmit={save}
          style={{ marginTop: 24 }}
        >
          <h2 className="section-heading">{dateLabel(selected)}の予定</h2>
          <Field label="予定の名前">
            <input
              required
              maxLength={80}
              value={draft.title}
              onChange={(e) => setDraft({ title: e.target.value })}
            />
          </Field>
          <div className="row">
            <Field label="時間（任意）">
              <input
                type="time"
                value={draft.time}
                onChange={(e) => setDraft({ time: e.target.value })}
              />
            </Field>
            <Field label="種類">
              <select
                value={draft.kind}
                onChange={(e) => setDraft({ kind: e.target.value })}
              >
                <option value="other">その他</option>
                <option value="care">通院</option>
                <option value="payment">支払い</option>
              </select>
            </Field>
          </div>
          <Field label="メモ（任意）">
            <input
              maxLength={200}
              value={draft.memo}
              onChange={(e) => setDraft({ memo: e.target.value })}
            />
          </Field>
          <button className="button primary full">予定を保存する</button>
        </form>
      )}
    </>
  );
}
