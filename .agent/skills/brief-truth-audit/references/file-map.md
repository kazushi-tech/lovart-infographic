# Brief Truth Audit - File Map

## 対象ファイル一覧

| File | 責務 | 検証ポイント |
|------|--------|--------------|
| `components/GuidedBriefForm.tsx` | UI 入力 | Intent selector があるか、ExpectedOutputSummary があるか |
| `lib/guided-brief-options.ts` | オプション定義 | INTENT_OPTIONS が定義されているか |
| `app/api/runs/[runId]/qa/guided-submit/route.ts` | サーバー保存 | intent が QA state に保存されているか |
| `lib/style-resolver.ts` | style 解決 | intent を参照してスタイルを解決しているか |
| `lib/pipeline-core.ts` | prompt 構築 | intent 固有のプロンプト調整があるか |
| `config/style-presets.ts` | style 定義 | business-oriented preset があるか |
| `lib/slide-compositor.ts` | レンダリング | business archetype レンダリングが入っているか |
| `lib/content-quality-gate.ts` | 品質ゲート | error/warning 分離があるか、warnings 定義があるか |
| `app/api/runs/[runId]/step/route.ts` | ステップ実行 | warnings を UI に渡しているか |
| `components/RunDetail.tsx` | UI 表示 | warnings を表示しているか |

## 実装 truth チェックリスト

### Intent Wiring

- [ ] `INTENT_OPTIONS` が定義されている
- [ ] `guided-submit` が intent を QA state に保存している
- [ ] `style-resolver` が intent を参照している
- [ ] `pipeline-core` が intent 固有のプロンプト調整をしている
- [ ] `ExpectedOutputSummary` が UI に表示されている

### Presentability Warnings

- [ ] `IssueSeverity` type が定義されている
- [ ] `warnings` 配列が QualityGateResult に含まれている
- [ ] warnings が `quality-gate.json` に保存されている
- [ ] RunDetail が warnings を表示している

### Business Archetype

- [ ] Cover が thesis+support 構造になっている
- [ ] Executive Summary が takeaway-first になっている
- [ ] Comparison が 3列構造になっている
- [ ] Style preset が business-oriented に更新されている

## Runtime 検証項目

このスキル単独では検証できない項目（別途確認が必要）:

- [ ] Browser で guided brief の初期表示
- [ ] Intent 選択が実 output にどう効くか
- [ ] Cover / Summary / Comparison の見た目
- [ ] Warning UI の surfacing
- [ ] 実画像生成 E2E
- [ ] Mobile 実機
- [ ] Screen reader 実機
