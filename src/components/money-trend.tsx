"use client";
import { useStore } from "./store";
import { addDays, dateLabel, localDate, yen } from "@/lib/domain";
import { Empty } from "./common";

export function MoneyTrend() {
  const { data } = useStore();
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(localDate(), i - 13);
    const rows = data.transactions.filter((row) => row.date === date);
    return {
      date,
      recorded: rows.length > 0,
      income: rows
        .filter((row) => row.kind === "income")
        .reduce((sum, row) => sum + row.amount, 0),
      expense: rows
        .filter((row) => row.kind === "expense")
        .reduce((sum, row) => sum + row.amount, 0),
    };
  });
  const largest = Math.max(
    1,
    ...days.flatMap((day) => [day.income, day.expense]),
  );
  if (!days.some((day) => day.recorded))
    return <Empty>記録したお金の動きが、ここに並びます。</Empty>;
  return (
    <>
      <svg
        className="graph"
        viewBox="0 0 620 220"
        role="img"
        aria-label={`最近2週間のお金の推移。${days
          .filter((day) => day.recorded)
          .map(
            (day) =>
              `${dateLabel(day.date)}：収入${yen(day.income)}、支出${yen(day.expense)}`,
          )
          .join("。")}`}
      >
        <line x1="8" x2="612" y1="110" y2="110" stroke="#b8bfae" />
        {days.map(
          (day, i) =>
            day.recorded && (
              <g key={day.date}>
                <title>
                  {dateLabel(day.date)}：収入{yen(day.income)}、支出
                  {yen(day.expense)}
                </title>
                {day.income > 0 && (
                  <rect
                    x={12 + i * 44}
                    y={110 - (day.income / largest) * 90}
                    width="22"
                    height={(day.income / largest) * 90}
                    rx="3"
                    fill="#657958"
                  />
                )}
                {day.expense > 0 && (
                  <rect
                    x={12 + i * 44}
                    y="110"
                    width="22"
                    height={(day.expense / largest) * 90}
                    rx="3"
                    fill="#b07858"
                  />
                )}
              </g>
            ),
        )}
      </svg>
      <div className="graph-labels">
        <span>{dateLabel(days[0].date)}</span>
        <span>きょう</span>
      </div>
      <p className="chart-caption">
        上向きが収入、下向きが支出。記録のある日だけを表示しています。
      </p>
      <details>
        <summary className="small-link">日付ごとの金額を見る</summary>
        <ul className="small">
          {days
            .filter((day) => day.recorded)
            .map((day) => (
              <li key={day.date}>
                {dateLabel(day.date)}：収入 {yen(day.income)} ／ 支出{" "}
                {yen(day.expense)}
              </li>
            ))}
        </ul>
      </details>
    </>
  );
}
