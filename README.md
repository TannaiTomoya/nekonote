# ネコのて

> 途切れても、戻ればいい。

公開サイト：**[ネコのて](https://nekonote-seven.vercel.app)** ／ [アプリをひらく](https://nekonote-seven.vercel.app/today)

発達特性のある人が、今日の気持ち・お金・通院を一つの場所で記録し、生活が回っている状態を保つためのアプリです。

気分・家計簿・固定費・カレンダー・通院メモ・ふりかえり・相談先・表示設定・おかえり画面を実装しています。アカウントなしのブラウザ内保存と、Supabaseによる本人専用のクラウド保存に対応します。

## 設計の理解

- 最上位原則は「矯正しない」。空白や離脱を失敗として扱わず、戻ってきた瞬間を歓迎する
- 中核体験は、今日の気分を2タップ、お金を3タップで記録できること
- 最重要機能は、3日以上の離脱後に同じ文言で迎える「おかえり画面」
- 記録そのものを介入と捉え、診断・評価・助言・励ましを返さない
- 医療機関や制度の情報は保持せず、本人入力または公的窓口への導線に限定する
- LPとアプリをRoute Groupで分離し、3DはLPだけに閉じ込める
- 目標の「14日中7日」は開発側の検証指標であり、ユーザーへの未達表示には使わない

## 技術

- Next.js App Router / React / TypeScript
- Tailwind CSS
- Supabase（PostgreSQL / Auth / RLS）
- MapLibre GL JS + OpenStreetMap
- Vercel
- Three.js / react-three-fiber（LPのみ）

## 開発と検証

Node.js 24、npm、Google Chromeで検証しています。

```bash
npm ci
npm run dev
```

`.env.example`を参考に`.env.local`を作成し、クラウド利用時は`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`（Publishable keyまたはanon public key）を設定します。service_role／secret keyは使いません。環境変数がない場合も端末内保存で利用できます。

新しいSupabaseプロジェクトでは、[初期マイグレーション](supabase/migrations/202609180001_nekonote.sql)をSQL Editorで1回実行します。本プロジェクトではユーザーが実行済みです。再実行や既存テーブルの削除は不要です。

```bash
npm run typecheck
npm test
npm run build
npm run start -- --port 3200
```

サーバーを起動したまま別のターミナルで実行します。

```bash
TEST_BASE_URL=http://127.0.0.1:3200 npm run test:e2e
TEST_BASE_URL=http://127.0.0.1:3200 npm run screenshots
```

撮影用テストもE2E一式に含まれます。架空のデータを使用して`public/guide/`へ実画面を保存し、LPの操作ガイドに反映します。UI変更時は再撮影し、画像と説明の整合を目視確認してから公開します。

## 構成

- `src/app/(marketing)`：LP、LP専用3D
- `src/app/(app)`：アプリ、共通保存・復帰判定、各画面
- `src/components/store.tsx`：端末内保存・認証・クラウド同期
- `src/lib/domain.ts`：日付・収支・回復期間・CSV処理
- `supabase/migrations`：6テーブル、RLS、同期／削除RPC
- `assets/nekonote-paw.blend`：編集可能な3D原本
- `scripts/create-paw.py`：Blenderでのモデル／PNG／Draco GLB生成
- `tests`：ドメイン、Postgres RLS、ブラウザ操作、画面撮影

## Vercel公開

Vercelの`nekonote`プロジェクトとGitHubの`TannaiTomoya/nekonote`を接続しています。本番環境に上記2つの公開用環境変数を設定し、`npx vercel deploy --prod`で公開できます。`.env.local`や`.vercel/`はGitに含めません。

SupabaseのAuthentication → URL Configurationで、`https://nekonote-seven.vercel.app`をSite URLに、`https://nekonote-seven.vercel.app/settings`をRedirect URLsに登録してください。メール確認を無効化する必要はありません。

## 残っている検証・制約

- アプリを閉じた状態のプッシュ通知は未実装です。設定画面でも準備中と表示します。支払日・予定のアプリ内表示は実装済みです。
- 実メールでの登録→確認→ログイン→別端末同期は、利用者による最終確認が必要です。自動テストでは認証APIの契約テストとPostgres上のRLSを分けて検証しています。
- iOS Safari／Android Chromeの実機、低速回線のLCP 2.5秒、利用者による30秒入力の実測は未検証です。画面幅320／390pxのChromeテストは実施しています。
- オフライン利用はオンラインで初回読み込みが済んだブラウザが対象です。端末内保存は暗号化保管ではありません。共有端末での利用に注意し、必要に応じて書き出してください。
- 同時編集の競合は自動で上書きしません。端末内の記録をJSONで保管してから、明示的にクラウドを読み直せます。
- 「回復の証拠」は過去の記録に基づく期間の文章表示です。専用の過去期間比較グラフは未実装です。

## ドキュメント

- [最終仕様書 v2.1](docs/NEKONOTE_SPEC_FINAL.md)
- [実装・検証記録](docs/VERIFICATION.md)
- [利用ライブラリ・素材](THIRD_PARTY_NOTICES.md)

## 現在の状態

仕様書の原本は変更せず、実装上の差分と検証状況を別文書で管理します。
