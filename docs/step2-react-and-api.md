# Step 2: 機材一覧＆貸出申請（Vue経験者のための React 設計 + Laravel API）

- 目安: 3〜4日
- ゴール: 機材一覧の検索・絞り込み・ページネーションと、貸出申請・管理者承認フローを React + TypeScript + Laravel API で実装する。

---

## 1. Vue.js 経験者が最初に押さえるべき React の設計思想

ここを言語化できると、面接で **「Vue実務経験があるから React も本質を理解してすぐキャッチアップできる」** と強く証明できます。

| 観点 | Vue.js (v3 Composition API) | React (19 + TypeScript) |
| --- | --- | --- |
| 状態更新の仕組み | `ref` / `reactive` を直接書き換えると Proxy が検知して部分更新 | `useState` の setter に **新しい値（イミュータブル）** を渡すと関数コンポーネント全体が再実行される |
| 算出プロパティ | `computed(() => ...)` | 通常の変数計算（重い計算のみ `useMemo`） |
| 副作用 | `watch` / `watchEffect` / `onMounted` | `useEffect`（※データ取得や派生状態には極力使わない） |
| フォーム双方向バインド | `v-model` | 単方向データフロー（`value` + `onChange`、実務では `React Hook Form`） |
| テンプレート | `template` ブロック + ディレクティブ（`v-if`, `v-for`） | JSX（JavaScript の式そのもの：`&&`, `.map()`） |

### React で絶対に守るべき 3 原則

1. **状態（State）をイミュータブルに扱う**: 配列やオブジェクトを直接 `.push()` せず、`[...items, newItem]` のように新しい参照を作る。
2. **「サーバー状態」と「UI状態」を分ける**: API から取得した一覧データは `useState` + `useEffect` で手動管理せず、**TanStack Query（`useQuery` / `useMutation`）** に任せる。
3. **不要な `useEffect` を書かない**: 「props や state から計算できる値」はレンダリング中にそのまま計算する。`useEffect` は外部システム（DOM操作・タイマー・購読）との同期だけに使う。

---

## 2. バックエンド実装課題（Laravel REST API）

### 課題 1: 機材一覧 API（検索・絞り込み・ページネーション）

- エンドポイント: `GET /api/assets?keyword=...&category=...&status=...&page=1`
- 実装ポイント:
  - `AssetResource`（API Resource）を使って、DBカラムをそのまま返さず API レスポンス形式を明示的に定義する。
  - `paginate(20)` を使い、200件のデータをページ分割して返す。
  - 検索条件の組み立ては Eloquent のローカルスコープ（`scopeFilter()`）または Query クラスに整理する。

### 課題 2: 貸出申請・承認・返却 API

- `POST /api/loan-requests`（申請作成）
- `PATCH /api/loan-requests/{loanRequest}/approve`（管理者承認）
- `PATCH /api/loan-requests/{loanRequest}/reject`（管理者却下）
- `PATCH /api/loan-requests/{loanRequest}/return`（返却完了）
- 実装ポイント:
  - 入力検証は必ず **FormRequest**（例: `StoreLoanRequest`）に分離する（開始日・終了日の整合性、`purpose` 必須など）。
  - 承認・却下では Step 1 で作った `LoanRequestPolicy` を適用する。

---

## 3. フロントエンド実装課題（React + TypeScript）

### 課題 1: ライブラリ導入と型定義

```bash
cd frontend
pnpm add react-router-dom @tanstack/react-query react-hook-form zod @hookform/resolvers
```

- `src/types/asset.ts` / `src/types/loan.ts` に API レスポンス型を定義する。
- `src/lib/api.ts` に共通 fetch ラッパー（CSRFトークン付与・エラーハンドリング・401時の処理）を作成する。

### 課題 2: 機材一覧画面（TanStack Query の実践）

- 検索キーワード・カテゴリ・ステータス・ページ番号を URL クエリパラメータ（`useSearchParams`）で管理する。
  - **UX の工夫**: 検索結果を URL で共有でき、ブラウザの「戻る」でも検索条件が保持される。
- `useQuery({ queryKey: ['assets', params], queryFn: () => fetchAssets(params) })` でデータ取得する。
- ローディング中・エラー時・0件時の3パターンを分かりやすく表示する。

### 課題 3: 貸出申請フォーム（React Hook Form + Zod）

- 申請モーダル（または専用画面）を作成する。
- Zod スキーマで「開始日 ≦ 終了日」「利用目的は10文字以上」などのバリデーションを定義する。
- 送信成功時に `queryClient.invalidateQueries({ queryKey: ['assets'] })` を呼び、一覧を自動再取得させる。

---

## 4. 完了チェックリスト

- [ ] 機材一覧でキーワード検索・カテゴリ絞り込み・ページ切り替えができる
- [ ] ブラウザのリロードや戻るボタンで検索条件が維持される
- [ ] 一般社員で貸出申請ができ、管理者アカウントに切り替えると承認/却下ができる
- [ ] `useEffect` を使わずに一覧取得と絞り込みを実装できた
- [ ] `docs/interview-notes.md` に「Vue と React を書き比べて気づいた点」を3つ以上メモした

---

## 5. このステップの面接チェックポイント

- **Q. なぜ `useEffect` + `useState` ではなく TanStack Query を使ったのですか？**
  - ヒント: キャッシュ管理、競合状態（レースコンディション）の回避、ローディング・エラー状態の統一、更新後の自動再取得を自前実装するバグを防ぐため。
- **Q. 検索条件をローカル state ではなく URL クエリパラメータで持った理由は？**
  - ヒント: 社内ツールでは「この検索結果を見てほしい」と URL をチャットで共有するシーンが多いため。
