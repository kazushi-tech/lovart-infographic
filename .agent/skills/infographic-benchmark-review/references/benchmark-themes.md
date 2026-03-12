# Benchmark Themes

## ベンチマークテーマセット（5テーマ）

品質評価の再現性を確保するため、以下の5テーマを標準ベンチマークとして使用する。
各テーマは異なるビジネスドメインと資料用途をカバーする。

### Theme 1: 中堅企業のERP刷新

- カテゴリ: 古典的B2B提案
- 想定intent: intent_proposal / intent_executive
- 特徴: 既存システムとの比較、コスト試算、移行計画が求められる
- 評価ポイント: comparison の具体性、KPI の現実感、ロードマップの実行可能性

### Theme 2: AI活用による営業DX

- カテゴリ: テクノロジートレンド
- 想定intent: intent_executive / intent_proposal
- 特徴: バズワードに流されず具体的な効果を示せるか
- 評価ポイント: generic-smell への耐性、KPI の具体性、技術用語の適切な扱い

### Theme 3: ESG経営への移行計画

- カテゴリ: ガバナンス・コンプライアンス
- 想定intent: intent_plan / intent_report
- 特徴: 定性的な目標が多く、具体的KPIを設定しにくい
- 評価ポイント: 定性的テーマでの evidence-feel、ロードマップの段階性

### Theme 4: クラウド移行のROI分析

- カテゴリ: 技術的分析
- 想定intent: intent_comparison / intent_executive
- 特徴: 数値比較が中心、技術的詳細と経営判断のバランス
- 評価ポイント: comparison-contrast の定量性、KPI hygiene、sourceNote の充実度

### Theme 5: 新規事業立ち上げの意思決定

- カテゴリ: 戦略・意思決定
- 想定intent: intent_executive / intent_comparison
- 特徴: 不確実性が高く、仮説ベースの提案になりがち
- 評価ポイント: headline-specificity（抽象化しやすい）、actionable-cta の具体性

## ベンチマーク実行条件

- imageCount: 5（標準）
- 各テーマに対し最も自然な intent を1つ選択
- audience: audience_exec（統一）
- tone: tone_formal（統一）
- detail: detail_balanced（統一）

audience / tone / detail を統一することで、テーマとintent以外の変数を排除し、
プロンプト品質の純粋な比較を可能にする。
