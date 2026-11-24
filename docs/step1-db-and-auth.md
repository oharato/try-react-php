# Step 1: DB設計・マイグレーション・シードデータ・認証認可

- 目安: 2〜3日
- ゴール: `users` / `assets` / `loan_requests` / `tickets` / `ticket_comments` / `tags` のテーブル設計を Migration で構築し、150名規模のダミーデータを投入。一般社員と管理者のログイン・権限分離が動作する状態にする。

---

## 1. このステップで理解すること

### 1-1. Laravel の DB 周り（Rails / Flyway 経験者向け対比）

| 概念 | Rails / Java (Flyway) | Laravel (PHP) |
| --- | --- | --- |
| スキーマ変更管理 | ActiveRecord Migration / Flyway SQL | `php artisan make:migration` |
| ORM | ActiveRecord / JPA | Eloquent ORM |
| テスト・ダミーデータ | FactoryBot / Seed | Model Factory + Seeder |
| 型安全な定数 | Java Enum | PHP 8.1+ Backed Enum（例: `enum UserRole: string`） |

### 1-2. 認証（Authentication）と認可（Authorization）の違い

- **認証（誰であるか）**: Laravel Sanctum の SPA 認証（Cookie + セッション）。
  - フロントエンドから最初に `GET /sanctum/csrf-cookie` を叩いて CSRF トークンを取得し、その後 `POST /api/login` を行う。
  - JWT を `localStorage` に保存する方式に比べ、HttpOnly Cookie は XSS によるトークン窃取耐性が高い（セキュリティ面接で語れるポイント）。
- **認可（何をしてよいか）**: Laravel Policy（例: `LoanRequestPolicy`）。
  - 「貸出申請の作成は全社員OK」「承認・却下は `admin` ロールのみ」「自分の申請のキャンセルは本人のみ」を Controller ではなく **Policy クラスに集約** する。

---

## 2. 実装課題（自分の手で書く範囲）

### 課題 1: PHP Enum と Migration の作成

1. ステータスやロールを PHP の Backed Enum で定義する。
   - `app/Enums/UserRole.php`（`Employee = 'employee'`, `Admin = 'admin'`）
   - `app/Enums/AssetStatus.php`（`Available`, `Loaned`, `Maintenance`）
   - `app/Enums/LoanStatus.php`（`Pending`, `Approved`, `Rejected`, `Returned`）
   - `app/Enums/TicketStatus.php`（`Open`, `InProgress`, `Resolved`）
2. `PROPOSAL.md` の ER 図をもとに各テーブルの Migration を作成する。
   - 外部キー制約（`foreignId()->constrained()`）を必ず設定する。
   - `assets` テーブルに楽観ロック用の `version` カラム（デフォルト `1`）を入れる。
   - `tickets` テーブルに複合インデックス `(status, assignee_id, updated_at)` を貼る。

### 課題 2: 150名規模の Factory / Seeder 作成

募集要項の「利用者100名以上のサービスの設計、実装経験」を意識し、最初から現実的なデータ量で開発する。

- 管理者アカウント 3名（固定メールアドレス: `admin@example.com` など）
- 一般社員アカウント 150名
- 機材（`assets`） 200件（検証機、ノートPC、テスト端末、周辺機器など）
- 問い合わせチケット（`tickets`） 1,000件

### 課題 3: 認証 API と Policy の実装

1. `POST /api/login`, `POST /api/logout`, `GET /api/me` を実装する。
2. `LoanRequestPolicy` を作成し、`approve` / `reject` メソッドに管理者チェックを実装する。
3. React 側に最小のログイン画面とログアウトボタンを作り、ログイン状態に応じて `一般社員` / `管理者` の表示が切り替わることを確認する。

---

## 3. 完了チェックリスト

- [ ] `php artisan migrate:fresh --seed` でエラーなく150名・機材200件・チケット1,000件が投入される
- [ ] MySQL で `SHOW INDEX FROM tickets;` を実行し、複合インデックスが作成されていることを確認した
- [ ] 一般社員で管理者専用エンドポイントを叩くと `403 Forbidden` が返る
- [ ] `docs/adr/002-auth-and-db.md` に「なぜ Cookie 認証（Sanctum）を選んだか」「なぜこのインデックスを貼ったか」を記録した

---

## 4. このステップの面接チェックポイント

- **Q. JWT ではなくセッション/Cookie 認証を選んだ理由は？**
  - ヒント: 同一ドメインの社内 Web アプリでは、HttpOnly Cookie による XSS 耐性と、退職・権限剥奪時の即時セッション無効化がしやすい点が優れている。
- **Q. 認可ロジックを Controller に直接書かず Policy に分けた理由は？**
  - ヒント: 権限ルールの散逸を防ぎ、単体テストしやすくするため。
