# Prompt Paths — Intent を反映すべきプロンプト生成パス

## Pipeline Overview

```
GuidedBriefForm (UI)
  ↓ intent selection
guided-submit API
  ↓ save to QA state
style-resolver
  ↓ resolve style prompt header
pipeline-core::buildPromptsFromQA
  ↓ build prompts
pipeline-core::buildHybridPrompts
  ↓ build slide specs + background prompts
image generation
```

## Intent Wiring Points

### Point 1: style-resolver.ts

**現状**: Style question のみを参照。Intent は見ていない。

**課題**: Omakase モード時、intent に応じた推奨スタイルを決定できない。

**修正案**:

```typescript
export async function resolveStylePromptHeader(
  answers: Array<{...}>,
  questions?: Array<{...}>,
): Promise<string | null> {
  // NEW: Try intent-based resolution first
  const intentAnswer = questions
    ?.find(q => q.category === 'content' && q.text.includes('intent') || q.text.includes('Business intent'))
    && answers.find(a => a.questionId === intentAnswer?.questionId);

  if (intentAnswer && styleAnswer?.selectedOptionId === 'style_omakase') {
    const intentId = intentAnswer.selectedOptionId;
    const intentOption = INTENT_OPTIONS.find(o => o.id === intentId);
    if (intentOption?.suggestedStyleId) {
      const preset = getStylePreset(intentOption.suggestedStyleId);
      return preset?.promptHeader ?? null;
    }
  }

  // EXISTING: Fall back to style question
  // ... existing code
}
```

**ファイル**: `lib/style-resolver.ts`

### Point 2: pipeline-core.ts — buildHybridPrompts

**現状**: `buildNarrativePageKinds(imageCount)` を使用。Intent パラメータがない。

**課題**: Intent に応じた page kind sequence を構築できない。

**修正案**:

```typescript
export async function buildHybridPrompts(
  theme: string,
  answers: Answer[],
  imageCount: number,
  client: GeminiClient,
  config: PipelineConfig,
  intentId?: string,  // NEW: optional intent parameter
): Promise<HybridPromptResult> {
  // Extract intent from answers if not provided
  const effectiveIntent = intentId ?? extractIntentFromAnswers(answers);

  // Use intent-specific page kinds
  const pageKinds = buildNarrativePageKindsForIntent(imageCount, effectiveIntent);

  // Build intent-specific prompt context
  const intentContext = buildIntentContext(effectiveIntent);

  // ... rest of the function
}

function extractIntentFromAnswers(answers: Answer[]): string | undefined {
  const intentAnswer = answers.find(a =>
    a.questionId?.includes('intent') ||
    a.questionId?.includes('Business intent')
  );
  return intentAnswer?.selectedOptionId;
}

function buildIntentContext(intentId: string): string {
  const contexts: Record<string, string> = {
    'intent_executive': `
【役員説明・意思決定モード】
- 結論を最初に提示し、その後根拠を説明すること
- KPI や数値で主張を裏付けること
- 明確なアクション・次のステップを含めること
- cover は thesis + support + evidence 構成にすること
- executive-summary は takeaway-first にすること
- comparison は現状 vs 推奨の構造にすること`,
    // ... other intents
  };
  return contexts[intentId] || '';
}
```

**ファイル**: `lib/pipeline-core.ts`

### Point 3: step/route.ts — prompts step

**現状**: `buildHybridPrompts` を呼ぶとき intent を渡していない。

**修正案**:

```typescript
// Extract intent from QA state
const intentAnswer = run.qaState?.answers?.find(a =>
  a.questionId?.includes('intent') ||
  a.questionId?.includes('Business intent')
);

const intentId = intentAnswer?.selectedOptionId;

// Pass intent to buildHybridPrompts
const hybridResult = await buildHybridPrompts(
  run.theme,
  answers,
  imageCount,
  client,
  config,
  intentId,  // NEW
);
```

**ファイル**: `app/api/runs/[runId]/step/route.ts`

### Point 4: guided-brief-options.ts — Intent Definition

**現状**: `INTENT_OPTIONS` が定義されているが、`pageKindSequence` フィールドがない。

**修正案**:

```typescript
export interface IntentOption extends QAOption {
  expectedOutput: string;
  suggestedStyleId: string;
  pageKindSequence?: PageKind[];  // NEW
  promptContext?: string;  // NEW
}

export const INTENT_OPTIONS: IntentOption[] = [
  {
    id: 'intent_executive',
    label: '役員説明・意思決定',
    emoji: '👔',
    recommended: true,
    expectedOutput: '表紙 → 要約（結論先出し）→ 比較分析 → 提言・次のアクション',
    suggestedStyleId: 'consulting-minimal',
    pageKindSequence: ['cover', 'executive-summary', 'comparison', 'decision-cta'],
    promptContext: `【役員説明・意思決定モード】\n- 結論を最初に提示し、その後根拠を説明すること\n- KPI や数値で主張を裏付けること\n- 明確なアクション・次のステップを含めること`,
  },
  // ... other intents
];
```

**ファイル**: `lib/guided-brief-options.ts`

## Integration Points Summary

| Location | Current State | Required Change |
|----------|----------------|------------------|
| lib/guided-brief-options.ts | Intent definition only | Add pageKindSequence, promptContext |
| lib/style-resolver.ts | Style-only resolution | Check intent for omakase mode |
| lib/pipeline-core.ts | Intent-agnostic | Add intent param, use intent-specific logic |
| app/api/runs/[runId]/step/route.ts | No intent extraction | Extract intent, pass to buildHybridPrompts |

## Implementation Priority

1. **High**: `step/route.ts` で intent を抽出して `buildHybridPrompts` に渡す
2. **High**: `pipeline-core.ts` で intent パラメータを受け取り、page kind sequence を調整
3. **Medium**: `style-resolver.ts` で intent を見て omakase 時のスタイルを決定
4. **Medium**: `guided-brief-options.ts` に pageKindSequence, promptContext を追加
