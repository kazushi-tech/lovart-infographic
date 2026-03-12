# VisualBrief Schema

## Overview

The `VisualBrief` is the structured intermediate document that bridges QA answers and the background image prompt. It is built by `lib/background-visual-brief-builder.ts`.

## Interface Fields

### From RichBrief (QA-derived)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `businessObjective` | string | RichBrief.intent | The core business goal (e.g., "ERP刷新によるコスト削減") |
| `targetAudience` | string | RichBrief.audience | Who will view the deck (e.g., "経営会議メンバー") |
| `decisionContext` | string | RichBrief.tone + detail | The decision-making context and expected formality level |

### From SlideSpec (page-level)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `pageKind` | PageKind | SlideSpec.pageKind | One of 7 page types (cover, executive-summary, etc.) |
| `visualRole` | string | VISUAL_ROLE_BY_PAGE_KIND map | The visual function of this page's background (e.g., "hero-impact", "structured-compare") |

### From Style Resolution

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `styleFamily` | string | resolveStyleFamily() heuristic | One of: conservative-ir, consulting-editorial, operational-blueprint. Derived from audience + tone signals. |

### Motif Control

| Field | Type | Description |
|-------|------|-------------|
| `allowedMotifs` | string[] | Motif libraries permitted for this page (e.g., ["supply-chain", "data-flow"]) |
| `forbiddenMotifs` | string[] | Motif libraries explicitly excluded to avoid visual conflict |

### Technical Constraints

| Field | Type | Description |
|-------|------|-------------|
| `safeZoneContract` | object | Geometry defining where text will be composited. Background must remain visually quiet in these regions. Contains `top`, `bottom`, `left`, `right` as percentage values. |
| `noiseBudget` | number (0-1) | Maximum visual complexity allowed. 0 = solid color, 1 = maximum detail. Typically 0.3-0.6 for business decks. |
| `contrastBudget` | number (0-1) | Required contrast headroom for text overlay. Higher values mean the background must be more subdued. |

### Optional Hints

| Field | Type | Description |
|-------|------|-------------|
| `paletteHints` | string[] | Suggested color directions (e.g., ["corporate blue", "warm neutral"]) |
| `negativePromptAdditions` | string[] | Additional negative prompt terms beyond the standard set in negative-prompts.md |

## Derivation Flow

```
QA Answers
  |
  v
buildRichBrief()          --> businessObjective, targetAudience, decisionContext
  |
  v
SlideSpec generation      --> pageKind
  |
  v
VISUAL_ROLE_BY_PAGE_KIND  --> visualRole
  |
  v
resolveStyleFamily()      --> styleFamily (heuristic based on audience + tone)
  |
  v
motif selection           --> allowedMotifs, forbiddenMotifs
  |
  v
page-kind safe zone map   --> safeZoneContract, noiseBudget, contrastBudget
  |
  v
VisualBrief (complete)
```

## Usage in Prompt Assembly

The VisualBrief is consumed by `lib/background-prompt-runtime.ts` which:
1. Loads the appropriate prompt pack files based on VisualBrief fields
2. Assembles the final prompt string from master-system + constraints + page-kind + style-family + motifs
3. Runs 8-dimension critique on the assembled prompt
4. Optionally triggers LLM repair if critique score is below threshold
