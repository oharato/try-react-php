# CorpDesk 学習ガイド（React + TypeScript + PHP）

本ディレクトリは、`PROPOSAL.md` に基づいて **自分の手で React / TypeScript / モダンPHP / SQL を習得し、面接で語れる状態にする** ためのステップ別教材です。

既存の経験（Vue.js / TypeScript / Java / Ruby on Rails / 旧PHP / Docker / DB設計）と比較しながら、効率よく本質を掴める構成にしています。

---

## 進め方のルール

1. **コードは自分の手で書く**: AIに丸投げせず、各ステップの「実装課題」を自分で手を動かして実装する。
2. **設計の理由をメモする**: 迷った点や比較した選択肢は `docs/adr/` に短く残す。
3. **ハマった体験を資産にする**: エラーや詰まった箇所は `docs/interview-notes.md` に記録する（面接の最強のエピソードになる）。

---

## 学習ロードマップと教材一覧

| Step | 教材ファイル | ゴール | 目安 |
| --- | --- | --- | --- |
| Step 0 | `docs/step0-setup.md` | Docker Compose で Nginx / PHP 8.4 (Laravel) / MySQL / React (Vite) が疎通する | 1〜2日 |
| Step 1 | `docs/step1-db-and-auth.md` | DBマイグレーション・150名シードデータ・認証/認可（社員 vs 管理者）が動く | 2〜3日 |
| Step 2 | `docs/step2-react-and-api.md` | 機材一覧・検索・貸出申請を React + Laravel API で実装し、Vueとの違いを語れる | 3〜4日 |
| Step 3 | `docs/step3-concurrency-and-sql.md` | 排他制御（二重貸出防止）・FAQサジェスト・N+1/EXPLAIN検証・自動テストを実装 | 3〜4日 |
| Step 4 | `docs/step4-polish-and-interview.md` | UX改善・ポートフォリオREADME・12/5説明会メモ・職務経歴書への反映 | 2〜3日 |

---

## 記録・ログファイル

- `docs/adr/000-template.md`: 技術選定・設計判断ログ（ADR）テンプレート
- `docs/adr/001-tech-stack.md`: 開発環境・技術スタックおよびバージョン選定
- `docs/learning-log.md`: 日々の細かい学び・コマンド・つまずきメモ（TIL）
- `docs/interview-notes.md`: 面接想定QA・ハマった点ログ
