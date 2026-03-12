# CLAUDE.md — Lovart Infographic

## Project Overview

Vite + React 19 + Tailwind CSS v4 のインフォグラフィック生成SPA。
Express サーバーでホスティング、Gemini API で AI スライド生成＋背景画像生成。

AI Studio reference 実装を standalone 化したリポジトリ。

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

## Environment Variables

- `GEMINI_API_KEY` — Gemini API 呼び出し用（構造生成）
- `API_KEY` — 画像生成用（gemini-3.1-flash-image-preview、有料プロジェクト必要）
- `PORT` — サーバーポート（デフォルト: 3000）

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

### チェックリスト

- [ ] TypeScript型チェック通過
- [ ] ビルド成功
- [ ] コミットメッセージが適切
- [ ] Render Dashboardでデプロイ完了確認
- [ ] 本番URLで動作確認

## Skills Status

### Valid (this repo で使える)

| Skill | Location | Purpose |
| ----- | -------- | ------- |
| codex-review | .claude/skills/ | 厳格な品質レビューゲート |
| universal-review | .claude/skills/ | 日常の軽量レビュー |
| dense-plan | .claude/skills/ | 濃密プラン作成（多段レビュー+外部AI+1MS実装） |
| skill-creator | .claude/skills/ | 新 Skill 作成ガイド |
| business-slide-review-gate | .agent/skills/ | スライド品質評価 |
| infographic-benchmark-review | .agent/skills/ | 出力品質ベンチマーク |
| pptx-export-feasibility | .agent/skills/ | エクスポート戦略検討 |
| review-gate (workflow) | .agent/workflows/ | 品質ゲートワークフロー |

### Partially Valid (要アダプト)

| Skill | Issue |
| ----- | ----- |
| brief-truth-audit | file-map が旧 repo 前提。コンセプトは流用可能 |
| guided-intent-wiring | intent モデルは有効だが file 参照が旧 repo |
| infographic-prompt-pack-orchestration | pipeline-core.ts 等が存在しない |

### Invalid (旧 repo 依存、使用禁止)

| Skill | Reason |
| ----- | ------ |
| background-visual-review-gate | Nano Banana パイプライン依存 |
| nano-banana2-background-prompt-pack | Nano Banana2 専用 |
| deck-quality-90 | Next.js /dashboard, RunDetail.tsx 依存 |
| devtools-verify | Next.js port 3456, RunDetail.tsx 依存 |
| postgen-slide-editor | Next.js /dashboard, RunDetail.tsx 依存 |
| texttoslide (workflow) | Nano Banana スクリプト依存 |

## currentDate

Today's date is 2026-03-12.
