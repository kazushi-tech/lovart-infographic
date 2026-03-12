# Runtime Checklist

## Browser Smoke Test

### Guided Brief Flow

- [ ] Initial display: Intent selector が表示されている
- [ ] Mode tabs: お任せ / 条件選択 / カスタム の切り替えができる
- [ ] Intent selection: 各 intent を選択できる
- [ ] Style grid: Primary business / Secondary creative の分けが見える
- [ ] ExpectedOutputSummary: 選択に応じて内容が変わる
- [ ] Submit: 送信が成功する

### Output Preview

- [ ] Intent 変更時: ExpectedOutputSummary が即時更新される
- [ ] Style 変更時: styleLabel が正しく表示される
- [ ] Omakase モード: "自動（スタイル名）" 表示が正しい

## Generate Flow

- [ ] Generate 導線: ボタンがクリックできる
- [ ] Step status: qa → prompts → image → finalize の遷移が正しい
- [ ] Error handling: API キー未設定時の表示が正しい

## Slide Rendering (Visual Check)

### Cover

- [ ] Headline: thesis が伝わっている
- [ ] Subheadline: thesis を補強している
- [ ] KPIs: thesis を支える数値がある場合表示
- [ ] Layout: 3要素（headline/subheadline/KPI）のバランス

### Executive Summary

- [ ] Takeaways: 要点が先出しされている
- [ ] KPIs: takeaway を支える数値がある
- [ ] Structure: takeaway-first + evidence support

### Comparison

- [ ] Headers: 項目|現状|推奨 の3列が見える
- [ ] Rows: 最低2行の比較データがある
- [ ] Clarity: 現状と推奨の区別が明確

### Roadmap / Decision-CTA

- [ ] Phases: フェーズ順序が明確
- [ ] Action items: 次にやるべきことが具体的
- [ ] CTA: ctaTitle / ctaBody がある場合表示

## Warning Surfacing

- [ ] Quality gate warnings: 警告が表示される
- [ ] Warning details: どのスライドの何が問題か分かる
- [ ] Error vs warning: ブロックするエラーと非ブロック警告の区別がつく

## Cross-Browser Check

- [ ] Chrome: 正しく表示される
- [ ] Safari: 正しく表示される（可能な場合）
- [ ] Firefox: 正しく表示される（可能な場合）

## Mobile Check

- [ ] Portrait: 主要情報が見切れていない
- [ ] Landscape: スライドが適切にスケールされる
- [ ] Touch: 主要ボタンがタップ可能

## Accessibility Check

- [ ] Keyboard: Tab キーで操作可能
- [ ] Screen reader: 主要要素が読み上げられる
- [ ] Color contrast: AA レベルを満たしている

## Not Yet Verified Items

以下の項目は、このスキル単独では検証できない:

- [ ] 実画像生成 E2E（Gemini API 経由）
- [ ] 複数の異なるテーマでの出力比較
- [ ] Claude / NotebookLM との並列比較
- [ ] 各種実機でのテスト

## Evidence Collection

各項目について、以下の形式で証拠を記録:

```json
{
  "item": "Cover thesis support",
  "status": "PASS/FAIL/PARTIAL",
  "evidence": "サブヘッドラインが表示されている / KPIがある",
  "screenshot": "path/to/screenshot.png" // あれば
}
```
