import { PageTitle } from "@/components/common";
import { Icon } from "@/components/icons";
const links = [
  [
    "こころの相談窓口",
    "電話・SNSなど、相談方法から探せます。",
    "厚生労働省",
    "https://www.mhlw.go.jp/mamorouyokokoro/soudan/",
  ],
  [
    "発達障害者支援センター",
    "お住まいの地域の支援センターへ。",
    "発達障害情報・支援センター",
    "https://www.rehab.go.jp/ddis/action/center/",
  ],
  [
    "仕事の相談",
    "地域のハローワークの窓口へ。",
    "厚生労働省",
    "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/hellowork.html",
  ],
  [
    "暮らし・福祉の相談",
    "お住まいの自治体の障害福祉課や相談支援事業所へ。",
    "厚生労働省",
    "https://www.mhlw.go.jp/mamorouyokokoro/soudan/sonota/",
  ],
];
export default function Support() {
  return (
    <>
      <PageTitle
        eyebrow="SOMEWHERE TO TURN"
        title="相談したいときに"
        description="必要なときに、必要な窓口へ。"
      />
      <div className="stack">
        {links.map(([title, description, source, url]) => (
          <a
            className="link-card"
            key={title}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="heart" />
            <div>
              <h2>{title}</h2>
              <p>
                {description}
                <br />
                {source} · 別のタブでひらきます
              </p>
            </div>
            <Icon name="external" size={18} />
          </a>
        ))}
      </div>
      <p className="chart-caption">
        制度の条件や診療情報は、各窓口の公式サイトで確認できます。このアプリに制度・医療機関のマスタデータはありません。
      </p>
    </>
  );
}
