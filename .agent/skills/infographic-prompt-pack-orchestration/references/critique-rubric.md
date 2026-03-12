# Critique Rubric

## 8次元批評フレームワーク

生成された SlideSpec を以下の8軸で評価する。

### 1. headline-specificity（見出し具体性）

テーマ固有の名詞・数字を含む具体的な見出しか。

良い例: 「ERP刷新で年間1.2億円のコスト削減」
悪い例: 「業務効率化の推進」

### 2. kpi-hygiene（KPI衛生）

value に数字のみ、unit に単位が分離されているか。

良い例: value: "35", unit: "%削減"
悪い例: value: "35%削減見込"

### 3. pageKind-adequacy（ページ種別適合性）

comparison に comparisonRows、roadmap に roadmapPhases 等、
期待される構造フィールドが存在し最低数を満たすか。

最低数: comparison 2行、roadmap 2フェーズ、actionItems 2件

### 4. evidence-feel（エビデンス感）

具体的数値と sourceNote が揃い、読者が根拠を感じるか。

良い例: kpi value "1.2" unit "億円" + sourceNote "Gartner 2025調査"
悪い例: facts に「大幅な改善が見込まれる」のみ

### 5. generic-smell（汎用臭）

テーマを別のものに差し替えても成立する汎用的な内容か。

チェック方法: headline と facts からテーマ固有名詞を除去し、
まだ意味が通るなら汎用臭あり。

### 6. text-fit-risk（テキスト溢れリスク）

shared-constraints.md の文字数制限を超過するフィールドがあるか。

headline > 20文字、facts > 14文字、kpis.label > 16文字 等

### 7. comparison-contrast（比較対比度）

currentState と futureState に明確かつ定量的な差異があるか。

良い例: currentState "手動入力で月40時間" / futureState "自動化で月8時間"
悪い例: currentState "非効率" / futureState "効率的"

### 8. actionable-cta（CTA実行可能性）

actionItems に具体的な行動（誰が・何を・いつまでに）があるか。

良い例: 「IT部門が3月末までにPoC環境を構築する」
悪い例: 「今後検討を進める」

## 重篤度と修正トリガー

| レベル | 定義 |
|--------|------|
| critical | ビジネス資料として使用不可 |
| major | 品質が大幅に低下 |
| minor | 改善の余地あり |

修正発動条件:
```
criticalCount > 0 || majorCount >= 2
```

## 批評レポート形式

```json
{
  "dimensions": [
    {
      "name": "headline-specificity",
      "severity": "major",
      "slideIndex": 0,
      "finding": "headline が「業務効率化の推進」でテーマ固有性がない",
      "suggestion": "ERP固有の具体的な成果指標を見出しに含める"
    }
  ],
  "summary": {
    "criticalCount": 0,
    "majorCount": 2,
    "minorCount": 1,
    "repairTriggered": true
  }
}
```
