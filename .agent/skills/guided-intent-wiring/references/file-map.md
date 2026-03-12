# Guided Intent Wiring - File Map

## Wiring Target Files

| File | Role | Intent Usage Status | Required Change |
|------|------|-------------------|-----------------|
| `lib/guided-brief-options.ts` | Intent 定義 | INTENT_OPTIONS 定義済み | pageKindSequence, promptContext 追加 |
| `lib/style-resolver.ts` | Style 解決 | Intent 未参照 | Omakase 時 intent を見てスタイル決定 |
| `lib/pipeline-core.ts` | Prompt 生成 | Intent 未参照 | Intent パラメータ追加、intent 固有ロジック |
| `app/api/runs/[runId]/step/route.ts` | ステップ実行 | Intent 未抽出 | QA state から intent を抽出して渡す |
| `components/GuidedBriefForm.tsx` | UI 入力 | Intent 選択 UI 実装済み | 変更不要 |

## Dependency Graph

```
GuidedBriefForm (UI)
  ↓ user selects intent
  ↓ form submit
guided-submit API (route.ts)
  ↓ saves to QA state
  ↓ (intent stored)
step/route.ts (prompts step)
  ↓ needs to extract intent
  ↓ passes to
buildHybridPrompts (pipeline-core.ts)
  ↓ uses intent for
  ↓ page kind selection
  ↓ prompt context
style-resolver.ts
  ↓ (for omakase mode)
  ↓ uses intent for
  ↓ default style selection
```

## Current Gap Analysis

### Gap 1: Intent Extraction Missing

**Location**: `app/api/runs/[runId]/step/route.ts`

**Current Code**:
```typescript
const hybridResult = await buildHybridPrompts(
  run.theme,
  answers,
  imageCount,
  client,
  config,
  // No intent parameter!
);
```

**Required**: QA state から intent を抽出して渡す

### Gap 2: Intent-Agnostic Page Kinds

**Location**: `lib/pipeline-core.ts::buildNarrativePageKinds`

**Current Code**:
```typescript
export function buildNarrativePageKinds(imageCount: number): PageKind[] {
  // Fixed sequence based on image count only
  const bodyCount = Math.max(1, total - 2);
  return ['cover', ...buildBodyPageKinds(bodyCount), 'decision-cta'];
}
```

**Required**: Intent 固有の page kind sequence を生成

### Gap 3: No Intent-Specific Prompt Context

**Location**: `lib/pipeline-core.ts::buildHybridPrompts`

**Current**: Base prompt のみ

**Required**: Intent に応じた追加指示を追加

### Gap 4: Style Resolution Ignores Intent

**Location**: `lib/style-resolver.ts::resolveStylePromptHeader`

**Current**: Style question のみ参照

**Required**: Intent を見て omakase 時のデフォルトを決定

## Test Scenarios

### Scenario 1: Intent = Executive

**Input**:
- Intent: 役員説明・意思決定
- Image count: 5
- Style: omakase

**Expected Output**:
- Page kinds: cover → executive-summary → comparison → decision-cta
- Style: consulting-minimal (auto-selected)
- Prompt: 役員説明用の指示が含まれている

### Scenario 2: Intent = Comparison

**Input**:
- Intent: 比較検討・技術選定
- Image count: 5
- Style: omakase

**Expected Output**:
- Page kinds: cover → comparison → comparison → decision-cta
- Style: consulting-minimal (auto-selected)
- Prompt: 比較検討用の指示が含まれている

### Scenario 3: Intent = Plan

**Input**:
- Intent: 実行計画・ロードマップ
- Image count: 7
- Style: omakase

**Expected Output**:
- Page kinds: cover → problem-analysis → roadmap → roadmap → decision-cta
- Style: classic-blue (auto-selected)
- Prompt: ロードマップ用の指示が含まれている

## Verification Methods

1. **Code Review**: 修正後、各 wiring point が正しく実装されているか確認
2. **Unit Tests**: `buildNarrativePageKindsForIntent` のテストを追加
3. **Integration Tests**: QA state に intent を含めた状態で prompts step を実行
4. **Visual Check**: 実際の出力スライドで intent 固有の構造が反映されているか確認
