# Runtime Acceptance Criteria

## 概要

生成されたビジネスブリーフが実際のユーザー環境で受け入れられるかの基準。

## 検証環境

### 必須

- [ ] **Chrome (最新版)**: プライマリブラウザ
- [ ] **Local dev server**: localhost で実行
- [ ] **Guest mode**: クリーンな localStorage 状態

### 推奨

- [ ] **Safari**: Mac ユーザー向け
- [ ] **Firefox**: 他ブラウザ互換性確認

## ブラウザ Smoke Test

### 1. Guided Brief Flow

- [ ] 初期表示: Intent selector が表示されている
- [ ] Mode 切り替え: お任せ / 条件選択 / カスタム が切り替わる
- [ ] Intent 選択: 各 intent を選択できる
- [ ] ExpectedOutputSummary: 選択に応じて即時更新
- [ ] Style grid: Primary/Secondary の分けが見える
- [ ] Submit: 送信が成功し、遷移する

### 2. Generate Flow

- [ ] Prompt step: ステータスが正しく遷移 (pending → running → completed)
- [ ] Image step: 各画像の進捗が表示される
- [ ] Error handling: エラー時の表示が適切

### 3. Slide Rendering

#### Cover

- [ ] Headline: 読みやすく、thesis が伝わる
- [ ] Subheadline: thesis を補強している
- [ ] KPIs: ある場合、明確に表示されている
- [ ] Layout: 要素が重なっていない

#### Executive Summary

- [ ] Takeaways: 要点が見出しとして表示されている
- [ ] KPIs: 数値が大きく表示されている
- [ ] Structure: 情報が整理されている

#### Comparison

- [ ] 3列構造: 項目|現状|推奨 が見える
- [ ] Headers: ヘッダーが明確
- [ ] Rows: 各行が読みやすい

#### Roadmap / Decision-CTA

- [ ] Phases: フェーズが順序よく表示されている
- [ ] Action items: アクションが具体的
- [ ] CTA: 次のステップが明確

### 4. Warning Display

- [ ] Warnings 存在時: 警告が表示される
- [ ] Warning detail: 何が問題か分かる
- [ ] Non-blocking: 警告が出ても操作可能

## レスポンシブデザイン

### Desktop (1920x1080+)

- [ ] Cover: 最適表示
- [ ] Summary: 情報密度が適切
- [ ] Comparison: 3列構造が見やすい
- [ ] Full deck: スライド間で一貫性がある

### Tablet (768px-1024px)

- [ ] Cover: 読みやすい
- [ ] Summary: 要素が見切れていない
- [ ] Comparison: 3列が見える
- [ ] Navigation: スライド移動が可能

### Mobile (320px-767px)

- [ ] Cover: 主要情報が見える
- [ ] Summary: 要点が読める
- [ ] Comparison: スクロールで確認可能
- [ ] Navigation: スライド移動がタップ可能

## アクセシビリティ

### Keyboard Navigation

- [ ] Tab: 主要要素にフォーカスが移動
- [ ] Enter/Space: ボタンが操作可能
- [ ] Arrow keys: スライド移動が可能

### Screen Reader

- [ ] Slide title: 読み上げられる
- [ ] Body text: 読み上げられる
- [ ] Structure: 見出し階層が理解可能
- [ ] Warnings: 警告が読み上げられる

### Color Contrast

- [ ] Text on background: WCAG AA (4.5:1) 以上
- [ ] Important elements: AAA (7:1) を推奨
- [ ] Color-only information: 色だけで情報を伝えていない

## パフォーマンス

### Load Time

- [ ] Initial page: < 3秒
- [ ] First slide: < 2秒
- [ ] All slides: 合計 < 10秒

### Image Rendering

- [ ] Per slide: < 2秒
- [ ] Progressive loading: プログレッシブ表示があるとベスト

### Export

- [ ] PDF 生成: 適切な時間
- [ ] HTML 生成: 適切な時間
- [ ] ZIP ダウンロード: 適切な時間

## 実機テスト

### PC 実機

- [ ] Windows: Chrome/Edge で正しく表示
- [ ] Mac: Chrome/Safari で正しく表示

### Mobile 実機

- [ ] iPhone: Safari で正しく表示
- [ ] Android: Chrome で正しく表示

### Screen Reader 実機

- [ ] NVDA (Windows): スライドが読める
- [ ] VoiceOver (Mac): スライドが読める

## E2E テストシナリオ

### シナリオ 1: 意思決定用ブリーフ

```
1. Intent = 役員説明・意思決定
2. Style = omakase
3. Generate
4. 検証:
   - Cover に thesis + support + evidence がある
   - Executive summary に takeaway-first がある
   - Comparison に 3列構造がある
   - Warnings があれば表示されている
```

### シナリオ 2: 比較検討ブリーフ

```
1. Intent = 比較検討・技術選定
2. Style = omakase
3. Generate
4. 検証:
   - Cover がある
   - Comparison が 3 スライド以上ある
   - 各 comparison に 3列構造がある
   - Decision-CTA で推奨が明確
```

### シナリオ 3: 実行計画ブリーフ

```
1. Intent = 実行計画・ロードマップ
2. Style = omakase
3. Generate
4. 検証:
   - Cover がある
   - Roadmap が 2 スライド以上ある
   - 各 roadmap にフェーズがある
   - Decision-CTA で次のステップが明確
```

## 受け入れ基準

以下の全てが満たされた場合、runtime accepted と判定:

- [ ] Browser smoke test に重大な問題がない
- [ ] Responsive design で致命的な問題がない
- [ ] Accessibility で致命的な問題がない
- [ ] 少なくとも 1 つの E2E シナリオが完了
- [ ] Warnings が適切に表示されている

## 非受け入れ条件

以下のいずれかがある場合、runtime not accepted:

- [ ] Critical error が発生
- [ ] スライドが表示されない
- [ ] 重要な情報が見切れている
- [ ] Navigation が動作しない
- [ ] Screen reader で読めない
