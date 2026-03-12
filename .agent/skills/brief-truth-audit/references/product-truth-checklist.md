# Product Truth Checklist

## Whitepaper Readiness Criteria

ビジネスでそのまま使えるホワイトペーパーと言い切るための基準。

### Must Haves

- [ ] **Intent-first input**: aesthetic choice より先に business intent を選べる
- [ ] **Intent-to-output wiring**: intent が prompt / narrative / style behavior に直接効く
- [ ] **Business archetype quality**: cover / executive summary / comparison が business docs として自然に見える
- [ ] **Presentability visibility**: operator が business presentability の弱点を追える
- [ ] **Verified runtime**: browser / 実画像生成の確認がある

### Whitepaper Mode Specific

- [ ] Whitepaper mode が infographic mode と同等かそれ以上の guided controls を持っている
- [ ] Web-sourced content と local content の統合が機能している
- [ ] Citation / evidence handling が実務で使えるレベルにある

### Not Required (for "business brief" not "whitepaper launch")

以下は "business brief" 段階では必須ではない:

- [ ] Whitepaper mode 全面再設計（infographic 側の改善で十分な場合）
- [ ] Manual slide authoring UI
- [ ] 90点のような断定的スコアリング
- [ ] Post-generation editor の大規模追加 polish

## Current State Assessment (fe4da55)

### Intent-first input: PARTIAL ✅

- UI に IntentSelector がある
- お任せ / 条件選択 / カスタム の mode 分けがある
- **But**: intent が intent 以外の downstream に効いていない

### Intent-to-output wiring: WEAK ❌

- Intent は QA state に保存される
- style-resolver は style のみを見ている
- pipeline-core は intent 固有のロジックを持っていない
- **Conclusion**: "保存されるだけ" の状態

### Business archetype quality: PARTIAL ✅

- Cover: thesis+support 構造へ寄せた
- Executive Summary: takeaway-first
- Comparison: 3列化
- **But**: runtime 実画像で未確認

### Presentability visibility: WEAK ❌

- Warnings はサーバー側で生成・保存される
- quality-gate.json には warnings が含まれる
- **But**: RunDetail で warnings を表示していない

### Verified runtime: NONE ❌

- Browser smoke 未実施
- 実画像生成 E2E 未実施

## Conclusion

**Status**: "Generic infographic → business brief direction" の中間地点

**Still missing for "whitepaper ready"**:
1. Intent-to-output wiring の強化
2. Warnings UI surfacing
3. Runtime 検証

## Remaining Gaps

| Gap | Priority | Effort |
|-----|----------|--------|
| Intent が prompt / narrative に直接効く | High | Medium |
| Warnings を UI に表示 | High | Low |
| Cover/Summary/Comparison の runtime 検証 | High | Medium |
| Roadmap/Decision の actionability 向上 | Medium | Medium |
