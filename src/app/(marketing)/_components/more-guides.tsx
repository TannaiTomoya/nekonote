import Image from "next/image";
const screens = [
  [
    "ledger",
    "家計簿",
    "月を選ぶと、その月の収支を確認できます。記録を削除した直後は「元に戻す」で取り消せます。",
  ],
  [
    "recurring",
    "まいつきの支払い",
    "名前・金額・支払日を登録。支払日の3日前からアプリ内に表示されます。",
  ],
  [
    "care-detail",
    "通院メモ",
    "次回の予約日とメモを保存すると、カレンダーに反映されます。",
  ],
  [
    "review",
    "ふりかえり",
    "記録した日だけを表示。気分とお金の動きを、自分のペースで眺められます。",
  ],
  [
    "settings",
    "表示・保存の設定",
    "見やすさや、ひらくきっかけを変更。ログイン、書き出し、データ削除もここから。",
  ],
  [
    "support",
    "相談先",
    "公的な相談窓口の公式サイトへ。必要なときに、別のタブでひらけます。",
  ],
];
export default function MoreGuides() {
  return (
    <details className="more-guides">
      <summary>家計簿・通院メモ・設定などの操作説明を見る</summary>
      <div className="extra-guide-grid">
        {screens.map(([image, title, description]) => (
          <article key={image}>
            <div className="phone-preview">
              <Image
                src={`/guide/${image}.png`}
                alt={`${title}の実際の操作画面`}
                width={390}
                height={844}
                sizes="(max-width:700px) 80vw, 260px"
              />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </details>
  );
}
