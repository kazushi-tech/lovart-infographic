# File Map: Background Image Prompt Data Flow

## End-to-End Pipeline

```
QA Answers (user input)
  |
  v
buildRichBrief()                    -- lib/prompt-brief-builder.ts
  | Extracts: intent, audience, tone, detail
  v
buildHybridPromptsV2()              -- lib/pipeline-core.ts
  |
  +---> SlideSpec generation path (text content)
  |
  +---> Background prompt generation path:
        |
        v
      buildVisualBrief()            -- lib/background-visual-brief-builder.ts
        | Combines: RichBrief fields + SlideSpec.pageKind
        | Resolves: styleFamily, visualRole, motifs, safeZone
        v
      loadPromptPack()              -- lib/background-prompt-pack-loader.ts
        | Reads: prompts/backgrounds/nano-banana2/**
        | Selects: page-kind file, style-family file, motif files
        v
      assembleBackgroundPrompt()    -- lib/background-prompt-runtime.ts
        | Merges: master-system + constraints + page-kind + style + motifs
        | Injects: VisualBrief context (business objective, audience, etc.)
        v
      critiquePrompt()              -- lib/background-prompt-runtime.ts
        | Scores: 8 dimensions (1-5 scale each)
        | Threshold: if avg < 3.0, trigger repair
        v
      [optional] repairPrompt()     -- lib/background-prompt-runtime.ts
        | LLM-based repair using critique feedback
        v
      Final background prompt
        |
        v
      Nano Banana2 API              -- Gemini image generation
        |
        v
      Background image (PNG)
        |
        v
      validateBackgroundImage()     -- lib/background-image-validator.ts
        | Checks: safe zone edge density
        v
      slide-compositor.ts           -- Composites text + background -> final slide
        |
        v
      Final slide image (PNG/SVG)
```

## Key Files

### Prompt Assets (version-controlled)

| Path | Role |
|------|------|
| `prompts/backgrounds/nano-banana2/VERSION.json` | Pack version metadata |
| `prompts/backgrounds/nano-banana2/master-system.md` | Art director system prompt |
| `prompts/backgrounds/nano-banana2/shared-constraints.md` | No-text, safe zone, noise rules |
| `prompts/backgrounds/nano-banana2/anti-patterns.md` | Visual anti-patterns |
| `prompts/backgrounds/nano-banana2/negative-prompts.md` | Negative prompt terms |
| `prompts/backgrounds/nano-banana2/repair-rubric.md` | 8-dimension evaluation rubric |
| `prompts/backgrounds/nano-banana2/page-kinds/*.md` | Per-pageKind art direction (7 files) |
| `prompts/backgrounds/nano-banana2/style-families/*.md` | Style presets (3 files) |
| `prompts/backgrounds/nano-banana2/motifs/*.md` | Motif libraries (4+ files) |
| `prompts/backgrounds/nano-banana2/few-shots/*.md` | Example prompts (1+ files) |

### Runtime Code

| Path | Role |
|------|------|
| `lib/background-visual-brief-builder.ts` | Builds VisualBrief from RichBrief + SlideSpec |
| `lib/background-prompt-pack-loader.ts` | Loads and selects prompt pack files |
| `lib/background-prompt-runtime.ts` | Assembles prompt, runs critique, triggers repair |
| `lib/background-image-validator.ts` | Post-generation safe zone validation |
| `lib/pipeline-core.ts` | Integration point (`buildHybridPromptsV2()`) |

### Output Artifacts

| Path | Role |
|------|------|
| `background-prompt-trace.json` | Per-run trace: prompt version, critique scores, repair flag |
