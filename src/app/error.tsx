"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="not-found">
      <h1>画面をひらけませんでした。</h1>
      <p>保存済みの記録は、このブラウザに残っています。</p>
      <button className="button primary" onClick={reset}>
        もう一度ひらく
      </button>
    </main>
  );
}
