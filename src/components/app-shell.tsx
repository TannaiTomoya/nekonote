"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { StoreProvider, useStore } from "./store";
import { Icon } from "./icons";
import { addDays, localDate, dateLabel, upcomingPayments } from "@/lib/domain";
const tabs = [
  ["/today", "きょう", "sun"],
  ["/money", "おかね", "wallet"],
  ["/calendar", "カレンダー", "calendar"],
  ["/review", "ふりかえり", "chart"],
];
function Shell({ children }: { children: ReactNode }) {
  const path = usePathname(),
    router = useRouter();
  const {
    data,
    ready,
    error,
    welcome,
    dismissWelcome,
    update,
    user,
    syncStatus,
  } = useStore();
  const dialog = useRef<HTMLDialogElement>(null);
  const onboarding = ready && !data.settings.onboarded;
  const visible = welcome || onboarding;
  useEffect(() => {
    if (visible && !dialog.current?.open) dialog.current?.showModal();
    else if (!visible && dialog.current?.open) dialog.current.close();
  }, [visible]);
  const close = () => {
    dismissWelcome();
    if (onboarding)
      update((d) => ({ ...d, settings: { ...d.settings, onboarded: true } }));
  };
  const due = upcomingPayments(data.recurring);
  const today = localDate();
  const appointments = data.events
    .filter((event) => event.date === today || event.date === addDays(today, 1))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return (
    <div className="application">
      <a className="skip-link" href="#main">
        本文へ移動
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/" prefetch={false}>
          <Icon name="paw" size={30} />
          <span>
            ネコのて<small>暮らしに、ひと手間。</small>
          </span>
        </Link>
        <div className="nav-caption">MY LITTLE SPACE</div>
        <nav aria-label="メインナビゲーション">
          {tabs.map(([href, label, icon]) => (
            <Link
              key={href}
              href={href}
              className={path.startsWith(href) ? "active" : ""}
              aria-current={path.startsWith(href) ? "page" : undefined}
            >
              <Icon name={icon} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/care">
            <Icon name="care" />
            通院のこと
          </Link>
          <Link href="/support">
            <Icon name="heart" />
            相談先
          </Link>
          <Link href="/settings">
            <Icon name="settings" />
            設定
          </Link>
          <p>途切れても、戻ればいい。</p>
          <span className="local-label">
            {user ? "クラウド同期を利用中" : "このブラウザに保存"}
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="app-header">
          <Link className="mobile-brand brand" href="/" prefetch={false}>
            <Icon name="paw" />
            ネコのて
          </Link>
          <span className="desktop-only">あなたのペースで、ここから。</span>
          <div>
            <span className="save-mode" title={user ? syncStatus : undefined}>
              <span />
              {user ? "クラウド同期" : "ブラウザ内保存"}
            </span>
            <Link className="icon-button" href="/settings" aria-label="設定">
              <Icon name="settings" />
            </Link>
          </div>
        </header>
        <main id="main" className="app-main">
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          {ready && due.length > 0 && (
            <Link className="payment-banner" href="/money/recurring">
              <Icon name="calendar" size={18} />
              {dateLabel(due[0].date)}　{due[0].name}の支払日
              <Icon name="arrow" size={16} />
            </Link>
          )}
          {ready && appointments.length > 0 && (
            <Link
              className="payment-banner"
              href="/calendar"
              aria-label="今日と明日の予定を確認"
            >
              <Icon name="calendar" size={18} />
              {dateLabel(appointments[0].date)}　{appointments[0].title}
              {appointments.length > 1
                ? ` ほか${appointments.length - 1}件`
                : ""}
              <Icon name="arrow" size={16} />
            </Link>
          )}
          {ready ? (
            children
          ) : (
            <div className="loading">記録をひらいています…</div>
          )}
          <footer className="app-footer">
            ネコのては医療行為・診断を行うサービスではありません。
          </footer>
        </main>
      </div>
      <nav className="bottom-tabs" aria-label="モバイルナビゲーション">
        {tabs.map(([href, label, icon]) => (
          <Link
            key={href}
            href={href}
            className={path.startsWith(href) ? "active" : ""}
            aria-current={path.startsWith(href) ? "page" : undefined}
          >
            <Icon name={icon} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <dialog
        ref={dialog}
        className="welcome-dialog"
        aria-label={welcome ? "おかえりなさい" : "はじめまして、ネコのてです。"}
        onCancel={close}
      >
        <div className="welcome-paw">
          <Icon name="paw" size={42} />
        </div>
        <p className="eyebrow">A LITTLE SPACE FOR YOU</p>
        <h2>{welcome ? "おかえりなさい" : "はじめまして、ネコのてです。"}</h2>
        <p className="serif">途切れても、戻ればいい。</p>
        {onboarding && !welcome && (
          <p className="muted">
            気持ち・お金・通院を、この場所に。
            <br />
            記録はこのブラウザ内に保存されます。
            <br />
            ブラウザのデータ削除で消えるため、設定から書き出せます。
            <br />
            医療行為・診断を行うサービスではありません。
          </p>
        )}
        <button
          className="button primary"
          onClick={() => {
            close();
            router.push("/today/mood");
          }}
        >
          きょうを記録する
          <Icon name="arrow" size={18} />
        </button>
        <button className="text-button" onClick={close}>
          あとで
        </button>
      </dialog>
    </div>
  );
}
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}
