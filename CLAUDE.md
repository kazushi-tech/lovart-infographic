# CLAUDE.md — Lovart Infographic

## Project Overview

Vite + React 19 + Tailwind CSS v4 のインフォグラフィック生成SPA。
Express サーバーでホスティング、Gemini API で AI スライド生成＋背景画像生成。

## Tech Stack

- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS v4
- **Build**: Vite 6
- **Backend**: Express.js (server.ts)
- **AI**: @google/genai SDK (Gemini API)
- **Dev**: tsx for TypeScript server execution

## Commands

```bash
npm run dev      # 開発サーバー起動 (port 3000)
npm run build    # Vite プロダクションビルド
npm run start    # プロダクションサーバー起動
npm run lint     # TypeScript型チェック
```

## Plan Creation

Whenever you create or significantly update a markdown file in `./plans`, run `codex-review` before implementation.

If `codex-review` is unavailable, use `universal-review` as fallback.

## ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in .agent/PLANS.md).

## Review Gate

At key milestones—after specs/plans updates, after major implementation steps, and before commit/PR/release—run review skill and iterate review → fix → re-review until clean.

Critical or Major findings block commit/push/deploy.

## Review Request Template

```text
レビューのみ。勝手に実装しない。
目的:
変更範囲:
非目標:
受け入れ基準:
特に見てほしいリスク:
```

## Decision Requests

When asking for a decision, use "AskUserQuestion".

## Deploy (Render)

mainブランチへのプッシュで自動デプロイ。

### 手順

1. `npm run lint` で型チェック
2. `npm run build` でビルド確認
3. `git push origin main` でデプロイ開始
4. Render Dashboard で確認

### チェックリスト

- [ ] TypeScript型チェック通過
- [ ] ビルド成功
- [ ] コミットメッセージが適切
- [ ] Render Dashboardでデプロイ完了確認
- [ ] 本番URLで動作確認
