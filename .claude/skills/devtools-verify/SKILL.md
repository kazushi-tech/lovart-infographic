---
name: devtools-verify
description: Chrome DevToolsでUIを検証するスキル。必ずゲストモード（クリーンなlocalStorage）でChromeを起動してから確認する。「DevToolsで確認」「ブラウザ確認」「UI検証」「画面チェック」等でトリガー。
---

# DevTools Verify Skill

Chrome DevTools Protocol (CDP) を使ったUI自動検証スキル。
ゾンビ接続・フリーズタブ問題を完全に回避する堅牢な実装。

## 核心的な知見（過去のデバッグで得た教訓）

### 1. Chromeのバックグラウンドタブフリーズ問題
Chromeはバックグラウンドタブを積極的にフリーズする。フリーズ状態では：
- WebSocket接続は成功する（ハンドシェイクOK）
- `Browser.getVersion`等のブラウザレベルコマンドは応答する
- **`Runtime.evaluate`等のページレベルコマンドは一切応答しない**

**対策**: コマンドをawaitせずfire-and-forget + `Page.reload` → `Page.loadEventFired`待機

### 2. CDP「1接続制限」問題
CDPは1つのページターゲットに対してページレベルWebSocket接続を**1つしか許可しない**。
前セッションのゾンビ接続が残ると、新しい接続でコマンドが応答しない。

**対策**:
- **方法A（推奨）**: 新しいChromeインスタンスを専用ポートで起動
- **方法B**: ブラウザレベルWSで`Target.attachToTarget`（セッション多重化）
- **方法C**: `Page.reload`でフリーズ解除（既存接続を使う場合）

### 3. Windows固有の問題
- Git BashのcurlはWindowsのlocalhostに接続できないことがある
- Chrome起動コマンドのパスは `"/c/Program Files/Google/Chrome/Application/chrome.exe"` を使用
- `--user-data-dir`には一意のtempディレクトリを使う（他Chromeセッションと衝突回避）

## 実行手順

### ステップ1: ターゲットの確認

```bash
# dev serverが動いているか確認（Next.jsの場合）
curl -s http://localhost:3456 -o /dev/null -w "%{http_code}" --connect-timeout 3 || echo "Not running"
```

### ステップ2: 既存のCDP接続を確認

```bash
# 既にCDPが利用可能か確認
curl -s http://localhost:9222/json/version --connect-timeout 3
```

### ステップ3: 接続方法の選択

#### A: 既存Chromeを使う場合（推奨 — ユーザーのログインセッション利用）

```bash
# ターゲット一覧
curl -s http://localhost:9222/json/list

# 検証スクリプト実行（verify_output/cdp_robust_verify.mjs）
cd "$PROJECT_ROOT" && node verify_output/cdp_robust_verify.mjs
```

#### B: 新規Chromeを起動する場合（クリーン環境テスト）

```bash
TMPDIR=$(mktemp -d)
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --remote-debugging-port=9223 \
  --user-data-dir="$TMPDIR" \
  --no-first-run \
  --no-default-browser-check \
  --disable-extensions \
  "http://localhost:3456" &
sleep 6
CDP_PORT=9223 node verify_output/cdp_robust_verify.mjs
```

### ステップ4: 検証スクリプトの実行

`verify_output/cdp_robust_verify.mjs` は以下を自動実行する：
1. ページターゲット自動検出
2. フリーズ解除（fire-and-forget + Page.reload）
3. ページ情報取得
4. ロゴ表示チェック（Issue 5: unoptimized prop）
5. ダウンロードボタン確認（Issue 1: fetch+Blob）
6. 画像ヘルスチェック
7. スクリーンショット保存（`verify_output/`配下）

### ステップ5: クリーンアップ

```bash
# 新規Chromeを起動した場合のみ
# タブを閉じてtempディレクトリ削除
rm -rf "$TMPDIR"
```

## CDPコマンド速度リファレンス

| コマンド | フリーズ時 | 正常時 |
|---------|----------|--------|
| `Browser.getVersion` | ✓ 応答 | ✓ 応答 |
| `Inspector.enable` | ✓ 応答 | ✓ 応答 |
| `Page.enable` | ✗ タイムアウト | ✓ 応答 |
| `Runtime.evaluate` | ✗ タイムアウト | ✓ 応答 |
| `Page.reload` (fire) | (応答不要) | ✓ 応答 |

## チェックリスト

### 基本チェック
- [ ] ページが正常に表示される
- [ ] コンソールエラーがない
- [ ] 画像が全て読み込まれている（broken images = 0）

### Nano Banana 2 固有チェック
- [ ] ロゴがIMGタグで表示（SVGフォールバックでない）
- [ ] ダウンロードボタン（PDF/ZIP）が存在（実行結果ページ）
- [ ] テキストが文字化けしていない（生成画像）
- [ ] テキストサイズが適切（タイトル≥8%、本文≥5%）

## 【最重要】検証完了の定義

**ダッシュボード表示 ≠ 検証完了**

検証完了を宣言するには、以下を全て満たすこと：

1. ゲストモードChromeで localhost に接続
2. `verify_output/cdp_qa_flow_test.mjs` でQAフロー5問全通し（PASS）
3. エラー「Invalid question format」等が出ないことを確認
4. スクリーンショットで目視確認

「ダッシュボードが表示されました→検証OK」は絶対に許されない。

## QAフローE2Eテスト

### 実行方法

```bash
# ゲストChromeを起動済みの状態で
CDP_PORT=9224 APP_PORT=3456 node verify_output/cdp_qa_flow_test.mjs
```

### DOM構造（オプションボタン検出）

- Q1（スタイル選択）: `[class*="grid-cols"]` 内の `button`
- Q2-Q5（通常質問）: `[class*="pl-9"]` 内の `button`
- 進捗追跡: `N/5 回答済み` テキストをregexで取得
- 注意: 回答済み質問が履歴として残るため、`answeredCount` の変化を確認してから次を検出

### APIキーの場所

- `sessionStorage.getItem('nb-gemini-chat-api-key')`（localStorageではない！）

### よくある失敗パターン

- `animate-pulse` でローディング判定 → 常にtrue（スタイルサムネイル）
- `localStorage` でAPIキーチェック → 見つからない（sessionStorageに移行済み）
- `maxOutputTokens: 1024` → Gemini 2.5 Flashのthinkingでトークン不足、JSON途中切れ

## 禁止事項

- **絶対に既存のChromeプロセスをkillしない**（`--user-data-dir`で分離）
- **Playwrightは使わない**（CDP直接使用）
- バックグラウンドタスクでCDP接続を放置しない（必ずfinallyで`ws.close()`）
- **ダッシュボード表示だけで検証完了と言わない**

## トラブルシューティング

| 症状 | 原因 | 対策 |
|------|------|------|
| WS接続OK、コマンド全タイムアウト | タブフリーズ | fire-and-forget + Page.reload |
| `Failed to open a new tab` | ブラウザ制限 | 新規Chrome起動 |
| `location.href` = `about:blank` | ページ未ロード | Page.reload or 待機時間延長 |
| 二重出力 | Node.jsプロセス重複 | スクリプト修正不要（無害） |
