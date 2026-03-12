# Post-Generation Slide Editor Skill

## Purpose

AI が生成したインフォグラフィックスライドを、生成後に素早く確認・修正・再生成できる
editor workspace を構築・維持するためのスキル。

**やること**: post-generation editing workspace
**やらないこと**: manual slide authoring UI

## Trigger

- 「エディタ」「editor workspace」「スライド編集」「post-gen editor」
- RunDetail の editor 化に関する議論・実装

## Workflow

### 1. Baseline Check

```
Read: components/RunDetail.tsx
Read: components/ImageGallery.tsx
Read: components/ImageLightbox.tsx
Read: app/api/runs/[runId]/edit/route.ts
```

- 既存の edit API / review mode / gallery 構成を確認
- references/file-map.md と照合

### 2. Editor Shell Design

- left: slide navigator (thumbnails + acceptance badge)
- center: main preview pane (large slide + nav)
- right: inspector/edit pane (feedback input + history)
- mobile: stacked layout (preview → navigator → inspector)

### 3. Implementation

1. `SlideNavigator` コンポーネント追加
2. `SlideInspector` コンポーネント追加
3. `InfographicPostQaView` を 3-pane editor layout に再編
4. acceptance signal を preview 近くへ移動
5. edit history 表示を inspector に追加

### 4. Accessibility Check

- references/accessibility-checklist.md の全項目を確認
- keyboard-only flow テスト
- aria-live / focus trap 確認

### 5. Validation

- generate → review → edit → export happy path
- edit failure path
- keyboard path
- mobile responsive check

## Key Files

See `references/file-map.md` for complete mapping.

## References

- `references/principles.md` - UX 原則
- `references/file-map.md` - ファイルマップ
- `references/accessibility-checklist.md` - a11y チェックリスト
- `references/review-rubric.md` - レビュー基準
