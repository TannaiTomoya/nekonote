import Image from "next/image";
import Link from "next/link";
import { Icon, CatFace } from "@/components/icons";
import PawStage from "./_components/paw-stage";
import MoreGuides from "./_components/more-guides";
const guide = [
  {
    number: "01",
    tag: "きもち",
    title: "表情を選んで、保存。",
    description:
      "いまの気分に近い猫を、ひとつ。ことばが浮かんだら、ひとこと添えて。",
    image: "mood",
    alt: "5つの猫の表情から気分を選び、保存する実際の入力画面",
  },
  {
    number: "02",
    tag: "おかね",
    title: "使った分だけ、つける。",
    description:
      "金額と分類を入れるだけ。今月あといくらかは、自動でまとまります。",
    image: "money",
    alt: "支出の金額と7つの分類を入力する実際のお金の画面",
  },
  {
    number: "03",
    tag: "つういん",
    title: "次の予定を、ここに。",
    description:
      "いつもの通院先と次回の予約。伝えたいことも、メモしておけます。",
    image: "calendar",
    alt: "記録のある日と通院予定を表示する実際のカレンダー画面",
  },
];
export default function Landing() {
  return (
    <main id="main">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span />
            あなたのペースで、暮らしを記録。
          </p>
          <h1>
            途切れても、
            <br />
            <span>戻ればいい。</span>
          </h1>
          <p className="hero-description">
            気持ちも、お金も、通院も。
            <br />
            手が回らない日のための、小さな居場所。
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/today">
              ネコのてをはじめる
              <Icon name="arrow" size={18} />
            </Link>
            <a className="hero-text-link" href="#howto">
              つかいかたを見る
              <Icon name="back" size={15} />
            </a>
          </div>
          <p className="hero-note">
            登録なしでも使えます <span>·</span> スマートフォンから、ひと手間。
          </p>
        </div>
        <div className="hero-visual">
          <div className="hero-arch" />
          <div className="hero-orbit" />
          <PawStage />
          <div className="floating-label label-feeling">
            <Icon name="sun" size={20} />
            <span>きょうの気持ち</span>
          </div>
          <div className="floating-label label-money">
            <Icon name="wallet" size={20} />
            <span>おかねのこと</span>
          </div>
          <div className="floating-label label-care">
            <Icon name="calendar" size={20} />
            <span>通院の予定</span>
          </div>
          <span className="hero-caption">a little help, at your own pace.</span>
        </div>
        <div className="scroll-cue">
          <span>SCROLL TO EXPLORE</span>
          <i />
        </div>
      </section>
      <div className="intro-strip">
        <Icon name="paw" size={22} />
        <p>猫の手も借りたい日に、猫が手を貸す。</p>
        <span>NEKONOTE</span>
      </div>
      <section id="about" className="lp-section about-section">
        <div className="section-kicker">
          <span>01</span> ABOUT NEKONOTE
        </div>
        <div className="section-intro">
          <h2>
            あれも、これも。
            <br />
            ひとりで抱えなくていい。
          </h2>
          <p>
            きょうの気分。今月の支払い。次の通院。
            <br />
            頭の中でばらばらになっていることを、
            <br />
            ひとつの場所に置いておく。
            <br />
            ネコのては、そんな暮らしの記録帳です。
          </p>
        </div>
        <div className="connected-notes">
          <div>
            <Icon name="sun" size={28} />
            <span>気持ちの記録</span>
            <small>きょうは、どんな日？</small>
          </div>
          <i>＋</i>
          <div>
            <Icon name="wallet" size={28} />
            <span>お金の記録</span>
            <small>今月あと、いくら？</small>
          </div>
          <i>＋</i>
          <div>
            <Icon name="care" size={28} />
            <span>通院の記録</span>
            <small>次の予約は、いつ？</small>
          </div>
          <span className="notes-bracket">ひとつの画面から、ひと手間で。</span>
        </div>
      </section>
      <section className="home-showcase">
        <div className="lp-section showcase-inner">
          <div className="showcase-copy">
            <p className="eyebrow">YOUR DAILY LITTLE SPACE</p>
            <h2>
              ひらけば、
              <br />
              きょうのことが、
              <br />
              ここに。
            </h2>
            <p>
              気持ちを置いて、お金をつけて。
              <br />
              次の予定を、そっと確認。
              <br />
              画面を行ったり来たりする負担を、小さく。
            </p>
            <Link className="text-link" href="/today">
              きょうの画面をひらく
              <Icon name="arrow" size={19} />
            </Link>
            <div className="showcase-caption">
              <Icon name="leaf" />
              <small>
                見やすさは、あなたに合わせて。
                <br />
                画面の刺激を3段階で調整できます。
              </small>
            </div>
          </div>
          <div className="desktop-preview">
            <div className="preview-toolbar">
              <span />
              <span />
              <span />
              <small>ネコのて / きょう</small>
            </div>
            <Image
              src="/guide/today-desktop.png"
              alt="気分・今月のお金・これからの予定が一画面にまとまったネコのての実画面"
              width={1280}
              height={900}
              sizes="(max-width:700px) 100vw, 750px"
            />
          </div>
        </div>
      </section>
      <section id="howto" className="lp-section howto-section">
        <div className="section-kicker">
          <span>02</span> HOW TO USE
        </div>
        <div className="section-intro">
          <h2>
            ほんの、ひと手間。
            <br />
            それだけで、記録になる。
          </h2>
          <p>
            気分は、表情を選んで保存の2タップ。
            <br />
            全部を埋める必要はありません。
            <br />
            書きたいところから、どうぞ。
          </p>
        </div>
        <div className="guide-grid">
          {guide.map((g) => (
            <article key={g.number} className="guide-card">
              <div className="guide-top">
                <span>{g.number}</span>
                <small>{g.tag}</small>
              </div>
              <div className="phone-preview">
                <Image
                  src={`/guide/${g.image}.png`}
                  alt={g.alt}
                  width={390}
                  height={844}
                  sizes="(max-width:700px) 80vw, 300px"
                />
              </div>
              <h3>{g.title}</h3>
              <p>{g.description}</p>
            </article>
          ))}
        </div>
        <MoreGuides />
        <p className="screenshot-note">
          掲載している画面は、動作確認時に撮影した実際のアプリです。表示内容は架空のサンプルです。
        </p>
        <div className="two-taps">
          <div>
            <p className="eyebrow">JUST TWO TAPS</p>
            <h3>
              いまの気持ちを、
              <br />
              そのままに。
            </h3>
            <p>
              表情を選ぶ <span>→</span> 保存する
            </p>
          </div>
          <div className="tap-cats">
            <CatFace mood={2} />
            <CatFace mood={3} />
            <CatFace mood={4} />
          </div>
          <PawStage small />
        </div>
      </section>
      <section id="promise" className="promise-section">
        <div className="lp-section promise-inner">
          <div>
            <div className="section-kicker">
              <span>03</span> OUR PROMISE
            </div>
            <h2>
              空白の日も、
              <br />
              あなたの日々だから。
            </h2>
            <p>
              書けない日があっても、記録はなくならない。
              <br />
              連続記録のバッジも、できなかった日の警告もありません。
              <br />
              またひらいたその日から、いつものように。
            </p>
            <p className="promise-tagline">途切れても、戻ればいい。</p>
          </div>
          <div className="welcome-preview">
            <Image
              src="/guide/welcome.png"
              alt="復帰した人を、おかえりなさい・途切れても、戻ればいい。の言葉で迎える実際の画面"
              width={390}
              height={844}
              sizes="(max-width:700px) 80vw, 310px"
            />
          </div>
        </div>
      </section>
      <section id="safety" className="lp-section safety-section">
        <div className="section-kicker">
          <span>04</span> MADE WITH CARE
        </div>
        <h2>
          あなたのための、
          <br className="mobile-only" />
          静かな道具であること。
        </h2>
        <div className="safety-grid">
          <article>
            <Icon name="heart" size={27} />
            <h3>判定も、助言も、しません。</h3>
            <p>
              気持ちに点数や評価をつけず、記録した事実をそのまま返します。診断や医療行為を行うサービスではありません。
            </p>
          </article>
          <article>
            <Icon name="shield" size={27} />
            <h3>記録は、あなたのもの。</h3>
            <p>
              端末内保存からはじめられます。クラウド保存はログインした本人だけ。データの書き出しと削除は、設定からいつでも。
            </p>
          </article>
          <article>
            <Icon name="leaf" size={27} />
            <h3>必要なとき、窓口へ。</h3>
            <p>
              制度や医療機関の情報を抱え込まず、公的な相談先へのリンクを用意しています。有料サービスへの送客はありません。
            </p>
          </article>
        </div>
      </section>
      <section className="last-cta">
        <Icon name="paw" size={36} />
        <p className="eyebrow">A LITTLE HELP FOR YOUR EVERYDAY</p>
        <h2>
          きょうのあなたから、
          <br />
          はじめよう。
        </h2>
        <Link className="button primary" href="/today">
          ネコのてをはじめる
          <Icon name="arrow" size={18} />
        </Link>
        <p className="muted">ひとことも書かなくたって、表情ひとつで。</p>
      </section>
    </main>
  );
}
