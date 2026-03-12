---
name: background-visual-review-gate
description: Quality review gate for background image prompts and generated backgrounds
triggers:
  - 背景レビュー
  - background review
  - visual review
  - image quality
---

# background-visual-review-gate

## Purpose
Evaluate background image prompt quality and generated image quality for business deck backgrounds.

## Review Axes
1. **Prompt Quality** (pre-generation): 8 dimensions from background-prompt-runtime.ts critique
2. **Image Quality** (post-generation): background-image-validator.ts safe zone check
3. **Visual Coherence**: Does the background match the page role and business context?

## Relationship to Other Components
- `background-prompt-runtime.ts`: Provides automated 8-dimension prompt critique
- `background-image-validator.ts`: Provides post-generation safe zone validation (edge density)
- `business-slide-review-gate`: Reviews final composited slides (text + background)
- This skill bridges prompt quality and image quality

## Benchmark Protocol
1. Single-page spot check: 1 theme, 1 pageKind, 1 style
2. Representative 4-page check: 1 theme, cover+comparison+roadmap+decision-cta
3. Full deck: 1 theme, all pages

## References
- `references/review-axis.md` - 8 critique dimensions with scoring rubric
- `references/benchmark-matrix.md` - Systematic test matrix
- `references/failure-examples.md` - Common failure patterns

## Verification
```bash
node .agent/skills/background-visual-review-gate/scripts/check-background-artifacts.mjs
```
