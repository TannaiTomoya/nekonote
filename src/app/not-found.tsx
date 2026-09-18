import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <h1>このページは見つかりませんでした。</h1>
      <Link className="button primary" href="/today">
        きょうへ戻る
      </Link>
    </main>
  );
}
