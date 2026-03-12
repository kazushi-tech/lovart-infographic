# Business Slide Review Gate Skill

## Purpose

Business brief quality を review / warning / runtime checklist として再利用する。

## When to Use

- Slide 品質を評価するとき
- Presentability warnings を確認するとき
- Final summary / handoff 作成時

## Core Workflow

1. **Review rubric**: ビジネス資料としての品質基準を適用
2. **Check warnings**: Presentability warning rules を適用
3. **Runtime acceptance**: 実際のユーザー環境で受け入れられるか確認
4. **Generate report**: Review 結果を生成

## References

- `references/review-rubric.md` — ビジネス資料品質基準
- `references/presentability-warning-rules.md` — Warning 規則定義
- `references/runtime-acceptance.md` — Runtime 受け入れ基準

## Script

`scripts/check-business-brief-output.mjs` — 出力スライドをレビュー

## Review Rubric

### Cover Page

| Criterion | Excellent | Good | Acceptable | Needs Improvement |
|-----------|-----------|-------|------------|-------------------|
| Thesis clarity | Main claim is immediately clear | Clear but could be stronger | Somewhat clear | Purpose unclear |
| Support presence | Strong subheadline/KPI support | Some support present | Minimal support | No support |
| Visual balance | Clean, professional | Minor balance issues | Noticeable issues | Poor balance |
| Business feel | Executive-ready | Mostly professional | Some infographic feel | Very infographic |

### Executive Summary

| Criterion | Excellent | Good | Acceptable | Needs Improvement |
|-----------|-----------|-------|------------|-------------------|
| Takeaway-first | Key insights immediately visible | Takeaways present | Minimal takeaway | No takeaways |
| Data support | Strong KPI/evidence | Some data | Minimal data | No data |
| Actionable | Clear next steps | Some actionability | Vague actions | No actions |
| Structure | Well-organized | Generally organized | Some混乱 | Confusing |

### Comparison

| Criterion | Excellent | Good | Acceptable | Needs Improvement |
|-----------|-----------|-------|------------|-------------------|
| Row adequacy | 4+ rows with clear structure | 3 rows good | 2 rows minimal | < 2 rows |
| Clarity | Current vs recommended very clear | Clear distinction | Somewhat clear | Confusing |
| Decision support | Recommendation is compelling | Recommendation present | Weak recommendation | No recommendation |

### Roadmap / Decision-CTA

| Criterion | Excellent | Good | Acceptable | Needs Improvement |
|-----------|-----------|-------|------------|-------------------|
| Phases | 4+ well-defined phases | 3 phases | 2 phases | < 2 phases |
| Actionability | Very specific actions | Reasonable actions | Vague actions | No actions |
| Timeline | Clear timeline | Some timing | Vague timeline | No timeline |

## Presentability Warning Rules

以下の warning rules は `content-quality-gate.ts` で既に実装されている:

### Blocking Errors (severity: 'error')

- `pageKind` が期待と異なる
- `subheadline` が cover でない
- Cover density 不足
- `facts` が minimum 未満
- `kpis/callouts` 不足
- `takeaways` が executive-summary でない
- `comparisonRows` が minimum 未満
- `roadmapPhases` が minimum 未満
- `actionItems` が minimum 未満
- `ctaTitle/ctaBody` が decision-cta でない

### Non-Blocking Warnings (severity: 'warning')

- `headline-length` — headline が長すぎる (CJK: 40, Latin: 60)
- `cover-support` — cover に thesis support がない
- `summary-takeaway` — executive-summary に takeaway がない
- `comparison-structure` — comparison が 2 行未満
- `decision-action-clarity` — decision-cta に action clarity がない
- `evidence-source` — numeric evidence に source note がない

## Runtime Acceptance

### Browser Compatibility

- [ ] Chrome (最新版): レンダリングが正しい
- [ ] Safari (可能な場合): レンダリングが正しい
- [ ] Firefox (可能な場合): レンダリングが正しい

### Responsive Design

- [ ] Desktop (1920x1080): 最適表示
- [ ] Tablet (1024x768): 読みやすい
- [ ] Mobile (375x667): 主要情報が見える

### Accessibility

- [ ] Keyboard navigation: Tab キーで操作可能
- [ ] Screen reader: 主要要素が読み上げられる
- [ ] Color contrast: AA レベル以上

### Performance

- [ ] Initial load: < 3秒
- [ ] Image rendering: 各スライド < 2秒
- [ ] Export: PDF/HTML が適切な時間で生成

## Scoring

### Overall Quality Score

各スライドタイプのスコアを集計:

```
Score = (Cover × 0.25) + (Executive Summary × 0.25) +
        (Comparison × 0.30) + (Roadmap/Decision × 0.20)
```

### Grade

| Score | Grade |
|-------|-------|
| 90-100 | Excellent - Business-ready |
| 80-89 | Good - Minor tweaks needed |
| 70-79 | Acceptable - Moderate improvements needed |
| < 70 | Needs Improvement - Major revisions required |

## Example Usage

```bash
cd .agent/skills/business-slide-review-gate
node scripts/check-business-brief-output.mjs --run-id <run-id>
```

## Integration

- Final report の "Business Output Changes" セクションに使用
- Handoff の次フェーズへ送る課題のソースとして使用
