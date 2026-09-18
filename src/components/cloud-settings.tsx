"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "./store";
import { Field } from "./common";
export function CloudSettings() {
  const { user, syncStatus, sync, importGuest, reloadCloud } = useStore();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [signup, setSignup] = useState(false);
  const db = supabase();
  if (!db) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = signup
        ? await db.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${location.origin}/settings` },
          })
        : await db.auth.signInWithPassword({ email, password });
      setPassword("");
      setMessage(
        result.error
          ? result.error.message.includes("Invalid login")
            ? "メールアドレスまたはパスワードを確認してください。"
            : result.error.message
          : signup && !result.data.session
            ? "確認メールを送りました。メールで確認したあと、この画面からログインしてください。"
            : "",
      );
    } catch {
      setMessage("接続できませんでした。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  };
  return user ? (
    <div>
      <p className="small">ログイン中：{user.email}</p>
      <p className="sync-status" role="status">
        {syncStatus}
      </p>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="button outline" onClick={() => void sync()}>
          今すぐ同期
        </button>
        <button
          className="button outline"
          onClick={async () => {
            await db.auth.signOut();
          }}
        >
          ログアウト
        </button>
      </div>
      <button className="text-button" onClick={importGuest}>
        ログイン前の端末内記録を取り込む
      </button>
      {syncStatus.includes("別の端末") && (
        <>
          <p className="small">
            JSONを書き出して保管してから、クラウドの記録に切り替えてください。未同期の端末内変更は置き換わります。
          </p>
          <button className="button outline" onClick={() => void reloadCloud()}>
            クラウドの記録に切り替える
          </button>
        </>
      )}
    </div>
  ) : (
    <form onSubmit={submit}>
      <p className="muted">
        ログインすると、自分だけのクラウド保存を使えます。ログイン前の記録は、あとから取り込めます。
      </p>
      <Field label="メールアドレス">
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="パスワード">
        <input
          type="password"
          minLength={8}
          autoComplete={signup ? "new-password" : "current-password"}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <button className="button primary full" disabled={busy}>
        {busy ? "接続しています…" : signup ? "アカウントを作る" : "ログイン"}
      </button>
      <button
        type="button"
        className="text-button"
        onClick={() => setSignup(!signup)}
      >
        {signup ? "ログインへ戻る" : "はじめての方：アカウントを作る"}
      </button>
      <p className="small" role="status">
        {message}
      </p>
    </form>
  );
}
