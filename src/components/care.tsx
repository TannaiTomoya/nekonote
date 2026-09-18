"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useStore, useDraft } from "./store";
import { PageTitle, Field, Empty, BackLink } from "./common";
import { Icon } from "./icons";
import { dateLabel } from "@/lib/domain";
const CareMap = dynamic(() => import("./care-map"), {
  ssr: false,
  loading: () => <p className="muted">地図をひらいています…</p>,
});
export function CareList() {
  const { data, update } = useStore();
  const [draft, setDraft] = useDraft("care-new", { name: "", memo: "" });
  return (
    <>
      <PageTitle
        eyebrow="YOUR CARE NOTE"
        title="通院のこと"
        description="いつもの場所と、伝えておきたいこと。"
      />
      <div className="stack">
        <section className="card">
          {data.care.length ? (
            data.care.map((c) => (
              <Link className="event-row" key={c.id} href={`/care/${c.id}`}>
                <div className="category-icon">
                  <Icon name="care" />
                </div>
                <div>
                  <strong>{c.name}</strong>
                  <small>
                    {c.nextVisit
                      ? `次回 ${dateLabel(c.nextVisit)}`
                      : "次回の予約を追加できます"}
                  </small>
                </div>
                <Icon name="arrow" size={18} />
              </Link>
            ))
          ) : (
            <Empty icon="care">自分の通う場所を登録できます。</Empty>
          )}
        </section>
        <form
          className="card form-card full"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.name.trim()) return;
            if (
              update((d) => ({
                ...d,
                care: [
                  ...d.care,
                  {
                    id: crypto.randomUUID(),
                    name: draft.name.trim(),
                    memo: draft.memo,
                    nextVisit: "",
                  },
                ],
              }))
            )
              setDraft({ name: "", memo: "" });
          }}
        >
          <h2 className="section-heading">通院先を追加</h2>
          <Field label="医療機関の名前">
            <input
              required
              maxLength={100}
              value={draft.name}
              onChange={(e) => setDraft({ name: e.target.value })}
              placeholder="自分が通う場所の名前"
            />
          </Field>
          <Field label="メモ（任意）">
            <textarea
              maxLength={2000}
              value={draft.memo}
              onChange={(e) => setDraft({ memo: e.target.value })}
              placeholder="伝えたいこと、持っていくもの"
            />
          </Field>
          <button className="button primary full">登録する</button>
        </form>
      </div>
    </>
  );
}
export function CareDetail({ id }: { id: string }) {
  const { data, update } = useStore();
  const care = data.care.find((c) => c.id === id);
  if (!care)
    return (
      <>
        <BackLink href="/care">通院のことへ戻る</BackLink>
        <Empty>この通院先は見つかりませんでした。</Empty>
      </>
    );
  return <CareDetailForm id={id} />;
}
function CareDetailForm({ id }: { id: string }) {
  const { data, update } = useStore(),
    router = useRouter();
  const care = data.care.find((c) => c.id === id)!;
  const [draft, setDraft] = useDraft(`care:${id}`, {
    name: care.name,
    memo: care.memo,
    nextVisit: care.nextVisit,
    lat: String(care.lat ?? ""),
    lng: String(care.lng ?? ""),
  });
  const [map, setMap] = useState(false),
    [error, setError] = useState("");
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const hasCoords = !!(draft.lat || draft.lng);
    const lat = Number(draft.lat),
      lng = Number(draft.lng);
    if (
      hasCoords &&
      (!draft.lat ||
        !draft.lng ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180)
    ) {
      setError("緯度（−90〜90）と経度（−180〜180）を両方入力してください。");
      return;
    }
    const ok = update((d) => {
      const drafts = { ...d.drafts };
      delete drafts[`care:${id}`];
      return {
        ...d,
        drafts,
        care: d.care.map((c) =>
          c.id === id
            ? {
                ...c,
                name: draft.name.trim(),
                memo: draft.memo,
                nextVisit: draft.nextVisit,
                lat: hasCoords ? lat : undefined,
                lng: hasCoords ? lng : undefined,
              }
            : c,
        ),
        events: [
          ...d.events.filter((e) => e.careId !== id),
          ...(draft.nextVisit
            ? [
                {
                  id: crypto.randomUUID(),
                  title: draft.name.trim(),
                  date: draft.nextVisit,
                  time: "",
                  kind: "care" as const,
                  careId: id,
                  memo: draft.memo,
                },
              ]
            : []),
        ],
      };
    });
    if (ok) router.push("/calendar");
  };
  return (
    <>
      <BackLink href="/care">通院のことへ戻る</BackLink>
      <PageTitle eyebrow="YOUR CARE NOTE" title={care.name} />
      <form className="card form-card" onSubmit={save}>
        <Field label="医療機関の名前">
          <input
            required
            maxLength={100}
            value={draft.name}
            onChange={(e) => setDraft({ name: e.target.value })}
          />
        </Field>
        <Field label="次回の予約日">
          <input
            type="date"
            value={draft.nextVisit}
            onChange={(e) => setDraft({ nextVisit: e.target.value })}
          />
        </Field>
        <Field label="メモ（任意）">
          <textarea
            maxLength={2000}
            value={draft.memo}
            onChange={(e) => setDraft({ memo: e.target.value })}
          />
        </Field>
        <details>
          <summary>場所を登録する（任意）</summary>
          <p className="chart-caption">
            本人が入力した地点だけを表示します。地図をひらくと、表示地域のタイルがOpenStreetMapから読み込まれます。
          </p>
          <div className="row" style={{ marginTop: 16 }}>
            <Field label="緯度">
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={draft.lat}
                onChange={(e) => setDraft({ lat: e.target.value })}
              />
            </Field>
            <Field label="経度">
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={draft.lng}
                onChange={(e) => setDraft({ lng: e.target.value })}
              />
            </Field>
          </div>
          {draft.lat && draft.lng && (
            <button
              type="button"
              className="button outline"
              onClick={() => setMap(true)}
            >
              登録地点の地図をひらく
            </button>
          )}
          {map && draft.lat && draft.lng && (
            <CareMap lat={Number(draft.lat)} lng={Number(draft.lng)} />
          )}
        </details>
        {error && <p role="alert">{error}</p>}
        <button className="button primary full" style={{ marginTop: 25 }}>
          保存してカレンダーへ
        </button>
      </form>
    </>
  );
}
