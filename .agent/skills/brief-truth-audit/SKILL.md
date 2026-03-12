# Brief Truth Audit Skill

## Purpose

Current repo truth と current summary claim のズレを点検し、before / after evidence を採取するスキル。

## When to Use

- 実装完了後、final summary を書く前
- handoff 作成時
- "本当に whitepaper ready か？" が議論された時

## Core Workflow

1. **Freeze baseline**: git rev-parse, git status, test/build/typecheck 結果を記録
2. **Read implementation**: 関連コードを読み込み、実装 truth を確認
3. **Identify gaps**: summary claim と実装 truth のズレをリストアップ
4. **Collect evidence**: before/after の証拠となるファイル内容・状態を記録

## References

- `references/file-map.md` — 対象ファイルの責務マッピング
- `references/product-truth-checklist.md` — whitepaper readiness チェックリスト
- `references/runtime-checklist.md` — runtime 検証項目

## Script

`scripts/collect-brief-evidence.mjs` — 実行で evidence JSON を生成

## Output

Evidence JSON に以下を含める:

```json
{
  "baseline": {
    "head": "fe4da55",
    "gitStatus": "...",
    "test": "PASS/FAIL",
    "build": "PASS/FAIL",
    "tsc": "PASS/FAIL"
  },
  "implementationTruth": {
    "intentWiring": "保存のみで downstream 未接続",
    "warningsUI": "サーバー保存のみで表示未実装",
    ...
  },
  "gaps": [
    {
      "claim": "intent が output に効く",
      "truth": "intent は QA state に保存されるだけ",
      "severity": "high/medium/low"
    }
  ],
  "verified": [...],
  "notYetVerified": [...]
}
```

## Example Usage

```bash
cd .agent/skills/brief-truth-audit
node scripts/collect-brief-evidence.mjs
```

## Integration

- 実装完了後の review gate の一部として使用
- final report の "Product Truth" / "Verified" セクションのソースとして使用
