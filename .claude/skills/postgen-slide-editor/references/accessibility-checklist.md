# Accessibility Checklist - Post-Generation Slide Editor

## Keyboard Navigation

- [ ] slide navigator: Arrow Up/Down で slide 切替
- [ ] slide navigator: Enter/Space で slide 選択
- [ ] main preview: Arrow Left/Right で前後移動
- [ ] edit input: Enter で送信、Escape でキャンセル
- [ ] Tab order: navigator → preview → inspector の順

## Focus Management

- [ ] 選択 slide 変更時に preview へ focus 移動
- [ ] focus ring が全要素で見える (2px+ outline)
- [ ] `aria-current="true"` で現在選択 slide を示す
- [ ] lightbox/dialog 展開時に focus trap が動作する
- [ ] dialog 閉じた後に元の要素へ focus 戻る

## Screen Reader

- [ ] navigator: `role="listbox"` + `role="option"` or `tablist`
- [ ] preview: `aria-label` で slide 番号とステータス
- [ ] acceptance signal: 色だけでなくラベルとアイコンあり
- [ ] regenerate 完了: `aria-live="polite"` で通知
- [ ] エラー発生: `aria-live="assertive"` で通知
- [ ] progress 更新: `aria-live="polite"` で通知

## Visual

- [ ] テキスト contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] 主要ボタン hit area ≥ 44px × 44px
- [ ] acceptance signal は色＋アイコン＋テキスト
- [ ] `prefers-reduced-motion` でアニメーション抑制
- [ ] dark mode 対応

## Mobile

- [ ] touch target ≥ 44px
- [ ] horizontal scroll なし (viewport 内に収まる)
- [ ] navigator が horizontal scroll 可能
- [ ] inspector が drawer/accordion で省スペース
