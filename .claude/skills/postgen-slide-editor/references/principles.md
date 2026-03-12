# Editor UX Principles

## Core Philosophy

AI が出した deck を、人間が短時間で仕上げる workspace を作る。
手作業のスライド制作 UI ではない。

## 体験原則

### 1. 左で管理、右で即プレビュー
- slide navigator で全体を俯瞰
- 選択 slide を即座にプレビュー

### 2. 1画面で完結
- 画面遷移なしで確認・修正・再生成・ダウンロード

### 3. Progressive Disclosure
最初に見せる: preview, navigator, acceptance signal, edit box
畳む: raw diagnostics, bg validation detail, compose warnings, prompt debug

### 4. 主アクションが明確 (Single Primary Action)
- 生成前: 「作成を開始」
- 生成中 review: 「採用して次へ」
- 生成後: 「この slide を修正」
- deck 完成後: 「共有用に出力」

### 5. Locality of Action
各 slide の近くで: 選択 / edit / 再生成 / 差分確認 / ダウンロード

### 6. 量産性を壊さない
- 生成前に全 slide を手で設定させない
- 生成後に必要な slide だけ触れる

## Layout

### Desktop (≥1024px)
```
┌─────────┬──────────────────┬─────────┐
│ Slide   │  Main Preview    │Inspector│
│Navigator│  (large slide)   │/ Edit   │
│(left)   │  + nav arrows    │  Pane   │
│         │  + acceptance    │(right)  │
└─────────┴──────────────────┴─────────┘
```

### Mobile (<1024px)
```
┌──────────────────┐
│  Main Preview    │
│  + acceptance    │
├──────────────────┤
│ Slide Navigator  │
│ (horizontal)     │
├──────────────────┤
│ Inspector / Edit │
└──────────────────┘
```
