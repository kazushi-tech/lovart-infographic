# File Map - Post-Generation Slide Editor

## Primary Files (Editor Shell)

| File | Role | Editor 化の変更 |
|------|------|-----------------|
| `components/RunDetail.tsx` | メインビュー。`InfographicPostQaView` が post-QA editor | 3-pane editor layout に再編 |
| `components/ImageGallery.tsx` | grid/vertical ギャラリー | slide navigator として再利用 |
| `components/ImageLightbox.tsx` | fullscreen lightbox + edit | inspector pane に統合 |
| `app/dashboard/page.tsx` | ダッシュボードルート | 変更なし (Phase 5 で pre-gen shell) |

## API Layer

| File | Role | 変更 |
|------|------|------|
| `app/api/runs/[runId]/edit/route.ts` | single-slide edit API | そのまま活用 |
| `app/api/runs/[runId]/route.ts` | run 取得 | 変更なし |
| `lib/run-store.ts` | artifact 保存/取得 | 変更なし |

## Supporting Components

| File | Role |
|------|------|
| `components/PipelineProgress.tsx` | パイプライン進捗表示 |
| `components/PipelineControls.tsx` | 一時停止/再開/停止 |
| `components/DownloadPanel.tsx` | ダウンロード UI |
| `components/QASummary.tsx` | QA 回答サマリ |
| `components/QAChat.tsx` | QA チャット UI |

## Hooks

| File | Role |
|------|------|
| `hooks/usePipelineRunner.ts` | パイプライン実行状態管理 |

## New Components (to create)

| Component | Role |
|-----------|------|
| `components/SlideNavigator.tsx` | 左ペイン: サムネイル一覧 + acceptance badge |
| `components/SlideInspector.tsx` | 右ペイン: edit feedback + history + details |

## Data Flow

```
Dashboard → RunDetail → InfographicPostQaView
                          ├── SlideNavigator (left)
                          ├── Main Preview (center)
                          │   ├── large slide image
                          │   ├── prev/next navigation
                          │   └── acceptance signal
                          └── SlideInspector (right)
                              ├── slide summary
                              ├── edit feedback input
                              ├── regenerate button
                              └── edit history
```

## Edit API Flow

```
User input feedback
  → POST /api/runs/{runId}/edit { imageIndex, feedback }
  → buildEditPrompt(original, feedback, styleHeader)
  → generateSlideImage(editPrompt, client, config, refImage)
  → saveArtifact(images/slide_N.jpg)
  → update prompts.json editHistory
  → invalidate export cache (PDF/HTML/ZIP)
```
