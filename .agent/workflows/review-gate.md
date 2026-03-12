# Review Gate Workflow

## Purpose

Claude実装の品質を、`codex-review` を中心としたゲート方式で安定化する。

## Gate Sequence

1. Plan Gate: `plans/*.md` 変更後にレビュー
2. Diff Gate: 実装差分レビュー
3. Runtime Gate: build/lint/test の実行結果確認
4. Release Gate: DevTools等による実機確認

## Blocking Rule

- `Critical` または `Major` が1件でもあれば BLOCKED。
- 修正して再レビューし、`PASS` になるまで commit/push/deploy 禁止。

## Recommended Commands

- `git status --short`
- `git diff --name-only`
- `git diff`
- `npm run build`
- `npm run lint`（利用可能な場合）

## Request Template

```text
レビューのみ。勝手に実装しない。
目的:
変更範囲:
非目標:
受け入れ基準:
特に見てほしいリスク:
```