# Review Rubric - Post-Generation Slide Editor

## Evaluation Categories

### 1. Editor Workspace (30 points)

| Criteria | Points | Pass Condition |
|----------|--------|---------------|
| 3-pane layout (navigator/preview/inspector) | 10 | desktop で 3 ペイン表示 |
| slide 選択で preview 即更新 | 5 | 選択と表示が同期 |
| acceptance signal が preview 近くに表示 | 5 | 同じ視野内 |
| mobile responsive | 5 | stacked layout |
| progressive disclosure | 5 | 詳細が畳まれている |

### 2. Edit Workflow (25 points)

| Criteria | Points | Pass Condition |
|----------|--------|---------------|
| feedback 入力 + 再生成 | 10 | /edit API 呼び出し成功 |
| regenerating state 明確 | 5 | spinner + disabled state |
| edit history 表示 | 5 | 過去の修正指示が見える |
| cache bust 後の画像更新 | 5 | 再生成後に新画像表示 |

### 3. Navigation (15 points)

| Criteria | Points | Pass Condition |
|----------|--------|---------------|
| slide thumbnails 一覧 | 5 | 全 slide が見える |
| 前後移動 (arrow/button) | 5 | 動作する |
| 問題 slide へ jump | 5 | acceptance badge で識別可能 |

### 4. Accessibility (20 points)

| Criteria | Points | Pass Condition |
|----------|--------|---------------|
| keyboard-only 操作可能 | 8 | Tab + Arrow + Enter で全操作 |
| focus ring 可視 | 4 | 全 interactive 要素 |
| aria-live 通知 | 4 | regenerate/error/progress |
| contrast + hit area | 4 | WCAG AA |

### 5. Regression Safety (10 points)

| Criteria | Points | Pass Condition |
|----------|--------|---------------|
| 既存 gallery 動作維持 | 4 | grid/vertical 切替 |
| 既存 review mode 動作 | 3 | 1枚ずつ確認 flow |
| download panel 動作 | 3 | PDF/HTML/ZIP DL |

## Scoring

- 90+: Ship-ready
- 80-89: Minor polish needed
- 70-79: Significant gaps
- <70: Major rework needed
