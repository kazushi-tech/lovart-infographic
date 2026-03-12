# Guided Intent Wiring Skill

## Purpose

`intent` を UI metadata から prompt / narrative / style behavior へ接続する。

## When to Use

- Guided brief の intent 機能を強化するとき
- Intent 選択が出力品質に効かない問題を解決するとき
- Intent-to-output wiring の設計レビュー

## Core Workflow

1. **Map intent to output behavior**: 各 intent がどのような出力構造になるか定義
2. **Identify wiring points**: intent を参照すべき downstream コード箇所を特定
3. **Implement wiring**: 各ポイントで intent を使うように修正
4. **Verify propagation**: intent が実際に output に反映されるか確認

## References

- `references/intent-map.md` — Intent から出力構造へのマッピング
- `references/prompt-paths.md` — Intent を反映すべき prompt 生成パス
- `references/file-map.md` — Wiring 対象ファイル

## Script

`scripts/check-intent-propagation.mjs` — Wiring 状況をチェック

## Intent Map

| Intent ID | Label | Expected Output | Recommended Style | Key Page Kinds |
|-----------|-------|----------------|-------------------|-----------------|
| intent_executive | 役員説明・意思決定 | 表紙 → 要約（結論先出し）→ 比較分析 → 提言・次のアクション | consulting-minimal | cover, executive-summary, comparison, decision-cta |
| intent_proposal | 提案・企画書 | 表紙 → 課題整理 → 解決策の比較 → ロードマップ → 依頼事項 | classic-blue | cover, problem-analysis, comparison, roadmap, decision-cta |
| intent_comparison | 比較検討・技術選定 | 表紙 → 選定基準 → 現状 vs 推奨の比較 → 効果予測 → 推奨案 | consulting-minimal | cover, comparison, comparison, decision-cta |
| intent_plan | 実行計画・ロードマップ | 表紙 → 背景と目的 → フェーズ別計画 → マイルストーン → 次のステップ | classic-blue | cover, problem-analysis, roadmap, decision-cta |
| intent_report | 報告・レポート | 表紙 → 実績サマリ → 詳細分析 → 課題と対策 → まとめ | government-standard | cover, executive-summary, deep-dive, deep-dive |

## Wiring Points

### 1. Style Resolution (`lib/style-resolver.ts`)

Intent を見て推奨スタイルを解決する。

```typescript
export async function resolveStylePromptHeader(
  answers: Array<{...}>,
  questions?: Array<{...}>,
): Promise<string | null> {
  // Find intent answer
  const intentAnswer = questions
    ?.find(q => q.category === 'intent' || q.questionId.includes('intent'))
    && answers.find(a => a.questionId === intentAnswer?.questionId);

  // Use suggested style based on intent
  if (intentAnswer && intentAnswer.selectedOptionId) {
    const intentOption = INTENT_OPTIONS.find(o => o.id === intentAnswer.selectedOptionId);
    if (intentOption?.suggestedStyleId) {
      const preset = getStylePreset(intentOption.suggestedStyleId);
      return preset?.promptHeader ?? null;
    }
  }

  // Fallback to style question
  const styleAnswer = questions?.find(q => q.category === 'style');
  if (styleAnswer) {
    // existing logic
  }

  return null;
}
```

### 2. Prompt Generation (`lib/pipeline-core.ts`)

Intent に応じた page kind sequence を構築する。

```typescript
export function buildNarrativePageKindsForIntent(
  imageCount: number,
  intentId?: string,
): PageKind[] {
  const total = clampImageCount(imageCount);
  const bodyCount = Math.max(1, total - 2);

  // Intent-specific body page kinds
  let bodyKinds: PageKind[];
  switch (intentId) {
    case 'intent_executive':
      bodyKinds = ['executive-summary', 'comparison', 'comparison'];
      break;
    case 'intent_proposal':
      bodyKinds = ['problem-analysis', 'comparison', 'roadmap'];
      break;
    case 'intent_comparison':
      bodyKinds = ['comparison', 'comparison', 'comparison'];
      break;
    case 'intent_plan':
      bodyKinds = ['problem-analysis', 'roadmap', 'roadmap'];
      break;
    case 'intent_report':
      bodyKinds = ['executive-summary', 'deep-dive', 'deep-dive'];
      break;
    default:
      bodyKinds = buildBodyPageKinds(bodyCount);
  }

  return ['cover', ...bodyKinds, 'decision-cta'];
}
```

### 3. Prompt Wording (`lib/pipeline-core.ts`)

Intent に応じたプロンプト調整を追加する。

```typescript
function buildIntentSpecificPrompt(
  theme: string,
  intentId: string,
  answers: Answer[],
): string {
  const intentPrompts: Record<string, string> = {
    'intent_executive': `
【役員説明・意思決定モード】
- 結論を最初に提示し、その後根拠を説明すること
- KPI や数値で主張を裏付けること
- 明確なアクション・次のステップを含めること`,
    'intent_proposal': `
【提案・企画書モード】
- 課題と解決策のペアで構成すること
- 比較表を活用して現状と解決策を対比すること
- ロードマップで実行計画を視覚化すること`,
    // ... 他の intent
  };

  const basePrompt = buildBasePrompt(theme, answers);
  return basePrompt + (intentPrompts[intentId] || '');
}
```

## Verification Checklist

- [ ] Intent が style-resolver で参照されている
- [ ] Intent に応じた page kind sequence が生成される
- [ ] Intent に応じた prompt 調整が行われている
- [ ] Omakase モードで intent ベースの推奨スタイルが使われる
- [ ] 予期される page kind sequence と実 output が一致する

## Example Usage

```bash
cd .agent/skills/guided-intent-wiring
node scripts/check-intent-propagation.mjs
```
