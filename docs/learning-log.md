# 学習ログ（TIL / つまずき・知識メモ）

各ステップで手を動かしながら学んだ細かい知識・構文・ハマりポイントを時系列で残すノート。

---

## 2026-11-24〜25: Step 0 — Docker / PHP-FPM / Nginx / MySQL 環境構築

### PHP / Dockerfile
- **PHP-FPM（FastCGI Process Manager）とは**:
  - PHP 単体には本番向けの HTTP サーバー機能がないため、前段の Nginx から FastCGI プロトコル（デフォルト 9000番ポート）で動的リクエストを受け取り、常駐ワーカープロセスプールで実行する仕組み（Rails の Puma ワーカーに近い役割）。
  - Docker 公式イメージは用途別に `-cli` / `-apache` / `-fpm` があり、Nginx と組み合わせる場合は `-fpm` を使う。
- **PHP バージョン選定（2026年11月時点）**:
  - PHP 8.6 は 2026年11月19日リリース直後で Laravel 12/13 や周辺パッケージが未対応のため見送り、安定して対応済みの **PHP 8.4**（または 8.5）を採用。
- **Laravel で定番の PHP 拡張と必要な OS パッケージ（Debian ベース）**:
  - `pdo_mysql`（JDBC 相当）、`mbstring`（マルチバイト文字列、`php:8.4-fpm` では標準組み込み済み）、`zip`（`libzip-dev`）、`bcmath`（Java の `BigDecimal` 相当）、`intl`（`libicu-dev`、JS の `Intl` 相当）。
  - Composer のパッケージ展開用に `git` / `unzip` も `apt-get` で導入。
- **Dockerfile のつまずき**:
  - `COPY --from=composer:2 /usr/bin/composer /usr/bin/composer` のように、`--from=...` オプションは必ず **`COPY` の直後** に書く（後ろに書くとホスト側のビルドコンテキストから探して `not found` になる）。
  - リンターは **Hadolint**（`docker run --rm -i hadolint/hadolint < docker/php/Dockerfile`）や Docker 標準の `docker build --check` が使える。

### Nginx（`docker/nginx/default.conf`）
- **基本文法**:
  - CSS に近い `{ ... }` 構造。各ディレクティブの末尾には `;` が必須だが、**ブロックの閉じカッコ `}` の後ろに `;` は付けてはいけない**（`};` は構文エラー）。
- **`location ~ ^/(api|sanctum)/`**:
  - `~` は Nginx に「後ろを正規表現（大小区別）で評価する」と指示する記号。
  - `^` は正規表現の「先頭一致」。`/api/` または `/sanctum/` で始まるパスだけにマッチする。
- **`try_files $uri $uri/ /index.php?$query_string;`**:
  - リクエストパス `$uri` に対して「①実ファイル → ②ディレクトリ → ③見つからなければ `/index.php`（クエリ文字列維持）」の順で探す。
  - Laravel のフロントコントローラ（`public/index.php`）へ全 API リクエストを流す定番パターン。
- **PHP-FPM 連携の要**:
  - `fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;` で、Nginx の `root`（`/var/www/html/public`）と PHP コンテナの `WORKDIR`（`/var/www/html`）を一致させる。
- **Vite HMR 用の WebSocket 転送**:
  - `proxy_http_version 1.1;` + `Upgrade` / `Connection "upgrade"` / `Host` ヘッダーが必要。

### Docker Compose / MySQL / Node
- **MySQL バージョン選定（2026年11月時点）**:
  - MySQL 8.0 は **2026年4月に EOL（サポート終了）** しているため、現行 LTS の **`mysql:8.4`** を採用。
- **MySQL コンテナの仕様**:
  - `MYSQL_ROOT_PASSWORD` 等の環境変数が無いと起動に失敗する。
  - DB・ユーザーの自動作成は **初回起動時（ボリュームが空のとき）のみ** 実行されるため、あとから変更したい場合は `docker compose down -v` でボリュームを作り直す。
- **Vite コンテナの注意点**:
  - コンテナ外（Nginx）からアクセスできるように `pnpm dev --host 0.0.0.0` を指定する必要がある（デフォルトは `localhost` のみ待ち受けで 502 になる）。
- **構文検証**: `docker compose config -q` で起動前に YAML と設定の妥当性をチェックできる。
- **Node 26 の変更点**: Node 26 イメージ（`node:26-alpine`）では `corepack` が標準同梱されなくなったため、`npm install -g pnpm` で導入する形に変更。
- **LAN アクセスとポート衝突**: ホスト側の別コンテナ（`javaflow-app`）が 8080 番を使用していたため Nginx の公開ポートを `8081:80` に変更。また、LAN 経由でホスト名アクセスしてもブロックされないよう `frontend/vite.config.ts` に `server.allowedHosts: true` を設定。

### Laravel / React 初期疎通（`/api/health`）
- **`docker compose run --rm` vs `exec`**:
  - `run --rm`: コンテナ停止中でも一時コンテナを起動して実行・終了後削除（`composer create-project` などの初期化向け）。
  - `exec`: `up -d` で起動中のコンテナに入って即実行（普段の `php artisan` 向け）。
- **Laravel 11 以降の API 初期化**: `php artisan install:api` で `routes/api.php` 作成と Laravel Sanctum 導入を一括実行できる。
- **React + TypeScript の基礎（Vue / Java との対比）**:
  - `useState` ≒ Vue の `ref`、`useEffect(..., [])` ≒ Vue の `onMounted`。
  - `useEffect` のコールバック自体は `async` にできない（クリーンアップ関数を返す仕様のため）。
  - TypeScript の `type` は型チェック専用で、Java の `class` のように `new` できない。
  - `fetch()` は2段階の `.then()`（1段目で `res.ok` チェック＆`res.json()`、2段目で JSON データを受け取って `setState`）＋ `.catch()` でエラー処理する。

### 開発環境トラブルシュート（VS Code Remote - SSH）
- **Remote - SSH で補完が効かないときの確認ポイント**:
  - 補完系拡張機能はローカルではなく **リモート側（`SSH: nuc7`）** にインストール・有効化が必要。
  - `ms-azuretools.vscode-containers`（Container Tools）と `docker.docker`（Docker DX）を同時に有効にすると `command 'docker.command.convertToLowercase' already exists` で Language Server が競合して落ちるため、どちらか一方に絞る。
  - Compose のキー補完は `redhat.vscode-yaml` + 言語モード `YAML` が最も確実。
