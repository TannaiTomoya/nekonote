import Link from "next/link";
import { Icon } from "@/components/icons";
import "./marketing.css";
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing">
      <a className="skip-link" href="#main">
        本文へ移動
      </a>
      <header className="lp-header">
        <Link className="brand" href="/">
          <Icon name="paw" size={31} />
          <span>ネコのて</span>
        </Link>
        <nav aria-label="サイトナビゲーション">
          <a href="#about">ネコのてについて</a>
          <a href="#howto">つかいかた</a>
          <a href="#promise">大切にしていること</a>
        </nav>
        <Link className="button primary lp-header-cta" href="/today">
          はじめる
          <Icon name="arrow" size={16} />
        </Link>
      </header>
      {children}
      <footer className="lp-footer">
        <div>
          <Link className="brand" href="/">
            <Icon name="paw" size={26} />
            ネコのて
          </Link>
          <p>猫の手も借りたい日に、猫が手を貸す。</p>
        </div>
        <div className="footer-links">
          <a href="#howto">つかいかた</a>
          <a href="#safety">データと安心</a>
          <Link href="/support">相談先</Link>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ネコのて</span>
          <p>医療行為・診断を行うサービスではありません。</p>
        </div>
      </footer>
    </div>
  );
}
