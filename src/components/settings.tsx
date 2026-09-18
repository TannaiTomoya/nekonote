"use client";
import { useState } from "react";
import { useStore } from "./store";
import { PageTitle } from "./common";
import { Icon } from "./icons";
import { CloudSettings } from "./cloud-settings";
import { exportCsv, localDate } from "@/lib/domain";
export function Settings() {
  const { data, update, erase, user } = useStore();
  const [message, setMessage] = useState("");
  const download = (kind: "json" | "csv") => {
    const blob = new Blob(
      [kind === "json" ? JSON.stringify(data, null, 2) : exportCsv(data)],
      { type: kind === "json" ? "application/json" : "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nekonote-${localDate()}.${kind}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <PageTitle
        eyebrow="MAKE YOURSELF AT HOME"
        title="あなたに合う、かたち。"
        description="いつでも、何度でも。設定を変えられます。"
      />
      <section className="card form-card">
        <div className="setting-row">
          <h2>画面の刺激</h2>
          <p className="muted">ひかえめでは、アニメーションも止まります。</p>
          <div className="segmented">
            {(["ひかえめ", "ふつう", "はっきり"] as const).map((label, i) => (
              <button
                key={label}
                aria-pressed={data.settings.stimulus === i + 1}
                className={data.settings.stimulus === i + 1 ? "selected" : ""}
                onClick={() =>
                  update((d) => ({
                    ...d,
                    settings: { ...d.settings, stimulus: (i + 1) as 1 | 2 | 3 },
                  }))
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <h2>ひらくきっかけ</h2>
          <p className="muted">
            いつもの習慣に、ひとつだけ。決めなくても大丈夫。
          </p>
          <select
            aria-label="ひらくきっかけ"
            value={data.settings.trigger}
            onChange={(e) =>
              update((d) => ({
                ...d,
                settings: { ...d.settings, trigger: e.target.value },
              }))
            }
          >
            <option value="">設定しない</option>
            <option value="morning">朝おきたら</option>
            <option value="after_meal">ごはんのあとに</option>
            <option value="after_bath">おふろのあとに</option>
            <option value="before_sleep">ねるまえに</option>
          </select>
        </div>
        <div className="setting-row">
          <h2>お知らせ</h2>
          <p className="muted">
            支払日・予定はアプリ内に表示します。音や振動はありません。アプリを閉じている間のプッシュ通知は、現在準備中です。
          </p>
        </div>
        <div className="setting-row">
          <h2>記録の保存先</h2>
          <p className="muted">
            このブラウザに自動保存しています。ブラウザのデータを消すと記録も消えます。書き出したファイルをご自身で保管してください。
          </p>
          <CloudSettings />
        </div>
        <div className="setting-row">
          <h2>記録を書き出す</h2>
          <p className="muted">ご自身のデータを、いつでも無料で。</p>
          <div className="row">
            <button className="button outline" onClick={() => download("json")}>
              <Icon name="download" size={17} />
              JSON
            </button>
            <button className="button outline" onClick={() => download("csv")}>
              <Icon name="download" size={17} />
              CSV
            </button>
          </div>
        </div>
        <div className="setting-row">
          <h2>
            {user
              ? "アカウントと全データを削除"
              : "このブラウザの全データを削除"}
          </h2>
          <p className="muted">
            記録・設定・入力途中のメモをすべて削除します。この操作は取り消せません。
          </p>
          <button
            className="button danger full"
            onClick={async () => {
              if (await erase()) setMessage("データを削除しました。");
            }}
          >
            {user ? "アカウントと全データを削除する" : "全データを削除する"}
          </button>
        </div>
        <p role="status">{message}</p>
      </section>
    </>
  );
}
