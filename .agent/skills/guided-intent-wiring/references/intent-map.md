# Intent Map — Intent から出力構造へのマッピング

## Intent Definition Table

| Intent ID | Label | Emoji | Expected Output (User-facing) | Suggested Style | Page Kind Sequence | Key Characteristics |
|-----------|-------|--------|------------------------------|-----------------|-------------------|---------------------|
| intent_executive | 役員説明・意思決定 | 👔 | 表紙 → 要約（結論先出し）→ 比較分析 → 提言・次のアクション | consulting-minimal | cover → executive-summary → comparison → decision-cta | 結論先出し、KPI 重視、明確なアクション |
| intent_proposal | 提案・企画書 | 📋 | 表紙 → 課題整理 → 解決策の比較 → ロードマップ → 依頼事項 | classic-blue | cover → problem-analysis → comparison → roadmap → decision-cta | 課題解決型、比較とロードマップ、依頼事項明確 |
| intent_comparison | 比較検討・技術選定 | ⚖️ | 表紙 → 選定基準 → 現状 vs 推奨の比較 → 効果予測 → 推奨案 | consulting-minimal | cover → comparison → comparison → comparison → decision-cta | 比較重視、現状 vs 推奨、選定基準 |
| intent_plan | 実行計画・ロードマップ | 🗺️ | 表紙 → 背景と目的 → フェーズ別計画 → マイルストーン → 次のステップ | classic-blue | cover → problem-analysis → roadmap → roadmap → decision-cta | ロードマップ重視、フェーズ別、マイルストーン |
| intent_report | 報告・レポート | 📊 | 表紙 → 実績サマリ → 詳細分析 → 課題と対策 → まとめ | government-standard | cover → executive-summary → deep-dive → deep-dive | データ重視、詳細分析、課題対策 |

## Page Kind Behavior per Intent

### Cover (共通)

全 intent で共通:

- **Thesis-first**: headline がメインメッセージ
- **Support**: subheadline で thesis を補強
- **Evidence**: KPI で thesis を裏付ける

### Executive Summary

| Intent | 特性 |
|--------|--------|
| intent_executive | 結論先出し、takeaway-first |
| intent_report | 実績サマリ、データ中心 |

### Problem Analysis

| Intent | 特性 |
|--------|--------|
| intent_proposal | 課題と解決策のペア |
| intent_plan | 背景と目的、現状分析 |

### Comparison

| Intent | 特性 |
|--------|--------|
| intent_executive | 比較分析、意思決定用 |
| intent_proposal | 現状 vs 解決策の比較 |
| intent_comparison | 現状 vs 推奨の比較（複数スライド） |

### Roadmap

| Intent | 特性 |
|--------|--------|
| intent_proposal | 実行ロードマップ |
| intent_plan | フェーズ別計画、マイルストーン |

### Deep Dive

| Intent | 特性 |
|--------|--------|
| intent_report | 詳細分析（複数スライド） |

### Decision-CTA (共通)

全 intent で共通:

- **Actionable**: 明確な次のアクション
- **Clear CTA**: ctaTitle + ctaBody で次にすべきことが伝わる

## Style Mapping

各 intent に推奨される style preset:

| Intent ID | Suggested Style | Reason |
|-----------|-----------------|--------|
| intent_executive | consulting-minimal | データ重視、戦略コンサル風 |
| intent_proposal | classic-blue | 提案書の定番、信頼感 |
| intent_comparison | consulting-minimal | 比較表向き、クリーン |
| intent_plan | classic-blue | プランニング用、構造的 |
| intent_report | government-standard | 報告書用、高コントラスト |

## Output Density Rules per Intent

| Intent | Body Count | KPIs | Facts | Comparison Rows | Roadmap Phases |
|--------|-------------|-------|-------|-----------------|-----------------|
| intent_executive | 3 | High | High | 2-3 | N/A |
| intent_proposal | 5 | Medium | Medium | 2-3 | 3-4 |
| intent_comparison | 5 | Medium | Low | 3-4 | N/A |
| intent_plan | 5 | Low | Medium | N/A | 3-4 |
| intent_report | 7 | High | High | N/A | N/A |

## Implementation Notes

1. **GuidedBriefForm** は IntentOption.suggestedStyleId を参照して推奨スタイルを表示
2. **guided-submit** は intent を category: 'content' として QA state に保存
3. **style-resolver** は intent を見て、omakase 時のデフォルトスタイルを決定すべき
4. **pipeline-core** は intent に応じた page kind sequence を構築すべき
5. **SlideSpec** 生成時、intent に応じたフィールドの強弱を調整すべき
