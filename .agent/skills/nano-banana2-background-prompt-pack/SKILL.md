---
name: nano-banana2-background-prompt-pack
description: Manages versioned background image prompt assets for Nano Banana2 image generation in the infographic pipeline
triggers:
  - 背景プロンプト
  - background prompt
  - image prompt pack
  - Nano Banana2
  - 背景画像
---

# nano-banana2-background-prompt-pack

## Purpose
Manage and evolve the versioned background image prompt pack at `prompts/backgrounds/nano-banana2/`.

## Key Concepts
- **Background-only policy**: Images contain NO text. Text is composited separately.
- **Visual Brief**: Structured document converting QA answers + SlideSpec into image-generation context
- **Style Families**: conservative-ir, consulting-editorial, operational-blueprint
- **Draft/Critique/Repair**: Local critique with 8 dimensions, optional LLM repair

## Architecture
- Prompt assets: `prompts/backgrounds/nano-banana2/**`
- Visual brief builder: `lib/background-visual-brief-builder.ts`
- Runtime: `lib/background-prompt-runtime.ts`
- Pack loader: `lib/background-prompt-pack-loader.ts`
- Integration: `lib/pipeline-core.ts` -> `buildHybridPromptsV2()`

## Asset Structure
See `references/prompt-pack-contract.md` for full directory layout.

## Workflow
1. Edit prompt assets in `prompts/backgrounds/nano-banana2/`
2. Commit with `prompt: ` prefix for background prompt changes
3. Test with spot check -> representative pages -> full deck
4. Review `background-prompt-trace.json` for quality metrics

## References
- `references/prompt-pack-contract.md` - Directory layout and versioning rules
- `references/visual-brief-schema.md` - VisualBrief interface documentation
- `references/pagekind-art-direction.md` - Per-pageKind art direction summary
- `references/file-map.md` - End-to-end data flow

## Verification
```bash
node .agent/skills/nano-banana2-background-prompt-pack/scripts/check-image-prompt-pack.mjs
```
