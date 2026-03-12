# Presentability Warning Rules

## 概要

`content-quality-gate.ts` で実装されている business presentability warning 規則。

## Severity Levels

- **error (ブロッキング)**: 修正しないと生成が失敗する
- **warning (非ブロッキング)**: 修正すべきだが、生成は続行される

## Warning ルール一覧

### W1. Headline Length Warning

**ID**: `headline-length`

**条件**: Headline 文字数が以下を超える場合
- CJK-heavy (50%以上): 40 文字
- Latin-heavy: 60 文字

**重要度**: Medium

**影響**: 読みにくい、スライドの視覚的バランスが崩れる

**推奨修正**: Headline を短くするか、サブヘッドラインに分割

### W2. Cover Support Warning

**ID**: `cover-support`

**条件**: Cover ページで subheadline も KPI もない場合

**重要度**: High

**影響**: Thesis (主張) が説得力を持たない

**推奨修正**: Subheadline または KPI を追加して thesis を補強する

### W3. Summary Takeaway Warning

**ID**: `summary-takeaway`

**条件**: Executive summary ページで takeaways がない場合

**重要度**: High

**影響**: 要点が分からない、結論先出しの原則が守られていない

**推奨修正**: Takeaways (要点) を 1 つ以上追加する

### W4. Comparison Structure Warning

**ID**: `comparison-structure`

**条件**: Comparison ページで comparisonRows が 2 未満の場合

**重要度**: High

**影響**: 比較として不十分、意思決定に使えない

**推奨修正**: 少なくとも 2 行の比較データを追加する

### W5. Decision Action Clarity Warning

**ID**: `decision-action-clarity`

**条件**: Decision-CTA ページで ctaTitle または ctaBody がない場合

**重要度**: High

**影響**: 次にすべきことが不明確、アクション可能性が低い

**推奨修正**: ctaTitle と ctaBody の両方を追加する

### W6. Evidence Source Warning

**ID**: `evidence-source`

**条件**: Body ページで数値証拠 (KPI, callout, comparison data, facts with digits) があるのに sourceNote がない場合

**重要度**: Medium

**影響**: 出典が不明、信頼性が低い

**推奨修正**: Source note を追加して数値の根拠を明示する

## Error ルール一覧 (ブロッキング)

### E1. PageKind Mismatch

**ID**: `pageKind`

**条件**: 期待される pageKind と実際が異なる場合

**重要度**: Critical

**影響**: 生成が失敗する

### E2. Cover Missing Subheadline

**ID**: `subheadline`

**条件**: Cover ページで subheadline がない場合

**重要度**: High

**影響**: Cover として不十分

### E3. Cover Density Insufficient

**ID**: `coverDensity`

**条件**: Cover で KPI も subheadline もない場合

**重要度**: High

**影響**: Cover として貧弱

### E4. Facts Insufficient

**ID**: `facts`

**条件**: Body ページで facts が minimum 未満の場合

**重要度**: High

**影響**: 情報密度が低い

### E5. KPIs/Callouts Insufficient

**ID**: `kpis/callouts`

**条件**: Body ページで KPIs または callouts が minimum 未満の場合

**重要度**: Medium

**影響**: データ不足

### E6. Takeaways Missing (Executive Summary)

**ID**: `takeaways`

**条件**: Executive summary ページで takeaways がない場合

**重要度**: High

**影響**: Executive summary として不十分

### E7. Comparison Rows Insufficient

**ID**: `comparisonRows`

**条件**: Comparison ページで comparisonRows が 3 未満の場合

**重要度**: High

**影響**: 比較として不十分

### E8. Roadmap Phases Insufficient

**ID**: `roadmapPhases`

**条件**: Roadmap ページで roadmapPhases が 3 未満の場合

**重要度**: High

**影響**: ロードマップとして不十分

### E9. Action Items Insufficient

**ID**: `actionItems`

**条件**: Summary/Decision ページで actionItems が minimum 未満の場合

**重要度**: High

**影響**: アクション可能性が低い

### E10. CTA Missing

**ID**: `cta`

**条件**: Decision-CTA ページで ctaTitle または ctaBody がない場合

**重要度**: High

**影響**: 次のステップが不明確

### E11. Source Note Missing (with Numeric Evidence)

**ID**: `sourceNote`

**条件**: ページで数値証拠があるのに sourceNote がない場合

**重要度**: High

**影響**: 信頼性が低い

## Warning Surfacing 現状

### サーバー側

- [x] `content-quality-gate.ts` で warnings を生成
- [x] `step/route.ts` で warnings を quality-gate.json に保存
- [ ] RunDetail で warnings を表示 (未実装)

### UI 表示案

#### RunDetail.tsx への追加

```typescript
// QualityGateResult から warnings を抽出
const qualityGateData = useMemo(() => {
  const qgArtifact = artifacts.find(a => a.filename === 'quality-gate.json');
  if (!qgArtifact) return null;
  try {
    return JSON.parse(qgArtifact.content);
  } catch {
    return null;
  }
}, [artifacts]);

// Warnings の表示
{qualityGateData?.warnings && qualityGateData.warnings.length > 0 && (
  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-4">
    <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
      ⚠️ プレゼンテーション警告 ({qualityGateData.warnings.length})
    </h3>
    <ul className="space-y-1">
      {qualityGateData.warnings.map((warning, i) => (
        <li key={i} className="text-xs text-yellow-700 dark:text-yellow-300">
          スライド {warning.slideIndex}: {warning.field} — {warning.expected} (現在: {warning.actual})
        </li>
      ))}
    </ul>
  </div>
)}
```

## 優先度マトリックス

| Warning ID | 重要度 | 修正難易度 | 優先 |
|------------|--------|-----------|-------|
| cover-support | High | Low | P0 |
| summary-takeaway | High | Low | P0 |
| comparison-structure | High | Low | P0 |
| decision-action-clarity | High | Low | P0 |
| headline-length | Medium | Low | P1 |
| evidence-source | Medium | Medium | P1 |

## 追加検討事項

### W7. Business Terminology Warning

**ID**: `business-terminology`

**条件**: ビジネス用語の使用が不十分な場合

**重要度**: Medium

**影響**: プロフェッショナル感が低い

### W8. Source Credibility Warning

**ID**: `source-credibility`

**条件**: 出典の情報が不十分な場合

**重要度**: Medium

**影響**: 信頼性が不明
