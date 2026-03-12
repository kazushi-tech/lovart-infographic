# Infographic Benchmark Review

## Purpose

生成されたインフォグラフィック出力の品質を、代表的なテーマのベンチマークセットと
観測軸に基づいて評価する。

## When to Use

- "benchmark review", "品質比較", "output review"
- プロンプト改善の前後で出力品質を比較するとき
- 新しいintentやページ種別の出力品質を検証するとき
- リグレッションチェック

## Key Observation Axes

1. **headline specificity** -- 見出しがテーマ固有で具体的か
2. **KPI clarity** -- KPI の value/unit 分離と数値の意味が明確か
3. **evidence density** -- sourceNote と具体的数値の充実度
4. **generic smell** -- テーマを差し替えても成立する汎用的な内容でないか
5. **text safety** -- 文字数制限内に収まりレイアウト崩れリスクがないか

## Benchmark Workflow

1. ベンチマークテーマセット（5テーマ）で SlideSpec を生成
2. 各テーマの出力を5つの観測軸で評価
3. 軸ごとにスコア（1-5）を付与
4. テーマ間の品質ばらつきを確認
5. 改善前後の差分を記録

## References

- `references/benchmark-themes.md` -- 5テーマのベンチマークセット
- `references/review-axis.md` -- 観測軸とスコアリング基準

## Integration

- infographic-prompt-pack-orchestration: プロンプト変更後のベンチマーク実行
- business-slide-review-gate: 観測軸が critique dimensions と連携
- brief-truth-audit: ベンチマーク結果を truth エビデンスとして記録
