# Critique Dimensions

## 8つの批評軸

SlideSpec 出力の品質を評価する8次元の批評フレームワーク。

### 1. headline-specificity（見出し具体性）

見出しが具体的なメッセージを伝えているか。
- critical: 見出しが「概要」「まとめ」等の汎用語のみ
- major: 見出しにテーマ固有の名詞・数字がない
- minor: 見出しがやや抽象的だが許容範囲

### 2. kpi-hygiene（KPI衛生）

KPI の value/unit 分離が正しく、数値が意味を持つか。
- critical: value に日本語テキストが混入、または KPI が皆無
- major: unit が欠落、または value のフォーマットが不統一
- minor: value の桁数表現が最適でない

### 3. pageKind-adequacy（ページ種別適合性）

各ページの内容がその pageKind に期待される構造を満たすか。
- critical: comparison に comparisonRows がない、roadmap に roadmapPhases がない
- major: 構造要素が最低数を下回る（comparison 2行未満、roadmap 2フェーズ未満）
- minor: 構造要素はあるが内容が薄い

### 4. evidence-feel（エビデンス感）

読者が「根拠がある」と感じる情報密度があるか。
- critical: 全スライドに具体的数値・出典がない
- major: sourceNote が欠落、数値の根拠が不明
- minor: sourceNote はあるが曖昧

### 5. generic-smell（汎用臭）

テーマを差し替えても成立するような汎用的な内容になっていないか。
- critical: 3枚以上のスライドがテーマ非依存の内容
- major: headline / facts にテーマ固有の名詞がない
- minor: 一部のスライドでテーマ固有性が弱い

### 6. text-fit-risk（テキスト溢れリスク）

文字数制限を超過してレイアウト崩れを起こすリスクがあるか。
- critical: headline が20文字超、facts が14文字超が多数
- major: 一部フィールドで制限超過
- minor: 制限ギリギリだがセーフ

### 7. comparison-contrast（比較対比度）

comparison ページで currentState と futureState に明確な差異があるか。
- critical: currentState と futureState がほぼ同じ内容
- major: 差異はあるが定量的でない
- minor: 差異は明確だがもう少し具体化できる

### 8. actionable-cta（CTA実行可能性）

decision-cta ページの行動喚起が具体的で実行可能か。
- critical: ctaTitle / ctaBody が欠落、または抽象的すぎる
- major: actionItems が曖昧（「検討する」レベル）
- minor: actionItems はあるが担当・期限が不明

## 重篤度レベル

| レベル | 定義 |
|--------|------|
| critical | ビジネス資料として使用不可。即時修正が必要 |
| major | 品質が大幅に低下。修正を強く推奨 |
| minor | 改善の余地あり。余裕があれば対応 |

## 修正トリガー

```
修正発動条件: criticalCount > 0 || majorCount >= 2
```

- critical が1件でもあれば即座に repair ループに入る
- major が2件以上累積した場合も repair ループに入る
- minor のみの場合は警告表示のみで通過を許可
