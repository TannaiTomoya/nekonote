"use client";
import Link from "next/link";
import { useStore } from "./store";
import { PageTitle, Empty } from "./common";
import { Icon } from "./icons";
import { localDate, addDays, recoveryEvidence, dateLabel } from "@/lib/domain";
import { ExpenseBars } from "./money";
import { MoneyTrend } from "./money-trend";
export function Review() {
  const { data } = useStore();
  const today = localDate();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const logs = days.map((day) => data.logs.find((l) => l.date === day));
  const evidence = recoveryEvidence(data.logs, today);
  return (
    <>
      <PageTitle
        eyebrow="LOOKING BACK, GENTLY"
        title="ふりかえり"
        description="日々のかたちを、そのまま眺める。"
      />
      <div className="stack">
        <section className="card">
          <div className="section-heading">
            <h2>
              <Icon name="sun" />
              気持ちのうつりかわり
            </h2>
            <span className="pill">最近の2週間</span>
          </div>
          {logs.some(Boolean) ? (
            <>
              <svg
                className="graph"
                viewBox="0 0 620 220"
                role="img"
                aria-label={logs
                  .filter(Boolean)
                  .map((l) => `${l!.date} 気分${l!.mood}`)
                  .join("、")}
              >
                {[1, 2, 3, 4, 5].map((m) => (
                  <line
                    key={m}
                    x1="10"
                    x2="610"
                    y1={205 - m * 35}
                    y2={205 - m * 35}
                    stroke="#e4e4d9"
                    strokeDasharray="3 7"
                  />
                ))}
                {logs.map(
                  (l, i) =>
                    l && (
                      <g key={l.id}>
                        {i > 0 && logs[i - 1] && (
                          <line
                            x1={20 + (i - 1) * 44}
                            x2={20 + i * 44}
                            y1={205 - logs[i - 1]!.mood * 35}
                            y2={205 - l.mood * 35}
                            stroke="#889975"
                            strokeWidth="2.5"
                          />
                        )}
                        <circle
                          cx={20 + i * 44}
                          cy={205 - l.mood * 35}
                          r="5"
                          fill="#889975"
                        />
                        <title>
                          {dateLabel(l.date)}：{l.note}
                        </title>
                      </g>
                    ),
                )}
              </svg>
              <div className="graph-labels">
                <span>{dateLabel(days[0])}</span>
                <span>きょう</span>
              </div>
              <p className="chart-caption">
                記録のある日だけを表示しています。表情を選んだときの気分の記録です。
              </p>
            </>
          ) : (
            <Empty>記録した気持ちが、ここに並びます。</Empty>
          )}
        </section>
        {evidence && (
          <section className="card" data-testid="recovery">
            <p className="eyebrow">あなたの過去の記録</p>
            <h2 style={{ fontSize: 18 }}>
              {dateLabel(evidence.start)}のあと、{evidence.days}
              日で戻っています。
            </h2>
            <p className="chart-caption">
              {evidence.start}〜{evidence.end}
              の連続した記録で、気分がご自身の全期間平均以上になった事実を表示しています。現在や将来の状態を判定・予測するものではありません。
            </p>
          </section>
        )}
        <section className="card">
          <div className="section-heading">
            <h2>
              <Icon name="wallet" />
              お金のうつりかわり
            </h2>
            <span className="pill">最近の2週間</span>
          </div>
          <MoneyTrend />
        </section>
        <section className="card">
          <div className="section-heading">
            <h2>
              <Icon name="wallet" />
              今月のおかね
            </h2>
            <Link className="small-link" href="/money">
              家計簿へ
            </Link>
          </div>
          <ExpenseBars />
        </section>
        <Link className="link-card" href="/support">
          <Icon name="heart" />
          <div>
            <h2>相談したいときに</h2>
            <p>窓口につながるリンクをまとめています。</p>
          </div>
          <Icon name="arrow" />
        </Link>
      </div>
    </>
  );
}
