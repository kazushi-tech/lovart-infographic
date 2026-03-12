# Review Axis: 8-Dimension Critique Rubric

## Overview

Each background image prompt is scored on 8 dimensions using a 1-5 scale. The critique is performed by `lib/background-prompt-runtime.ts` before image generation.

## Scoring Scale

| Score | Meaning |
|-------|---------|
| 1 | Critical failure - unusable |
| 2 | Significant issues - likely produces poor results |
| 3 | Acceptable - meets minimum bar |
| 4 | Good - reliable quality expected |
| 5 | Excellent - optimally crafted for this context |

## Dimensions

### 1. pageKind-adequacy
Does the prompt reflect the visual role of this specific page type?
- **1**: Generic prompt with no page-specific direction
- **3**: Mentions the page type but lacks specific compositional guidance
- **5**: Precisely describes composition, focal points, and visual hierarchy matching the pageKind

### 2. business-grade-feel
Will the generated image look professional enough for executive presentations?
- **1**: Casual, playful, or consumer-grade aesthetic
- **3**: Professional but generic stock-photo feel
- **5**: Premium, authoritative, matches top-tier consulting deck quality

### 3. motif-specificity
Are domain-relevant visual metaphors used instead of generic abstractions?
- **1**: No domain relevance (generic clouds, abstract waves)
- **3**: Loosely related motifs (generic "technology" imagery for an ERP deck)
- **5**: Precise business-domain motifs (supply chain nodes for logistics, data pipelines for analytics)

### 4. generic-wallpaper-smell
Inverse metric: does the prompt risk producing a generic wallpaper?
- **1**: High wallpaper risk - could be any presentation's background
- **3**: Some specificity but could still feel interchangeable
- **5**: Highly specific to this deck's theme and page - unmistakably purposeful

### 5. safe-zone-discipline
Does the prompt respect the safe zone where text will be composited?
- **1**: No mention of safe zones; likely produces detail in text areas
- **3**: Mentions keeping areas clear but lacks precise geometry
- **5**: Explicitly directs visual weight away from safe zones with specific spatial language

### 6. text-artifact-risk
How likely is the prompt to produce pseudo-text, numbers, or UI elements?
- **1**: High risk - prompt includes terms that often produce text artifacts
- **3**: Moderate risk - some ambiguous terms present
- **5**: Explicit negative constraints against text; no risky terms; clean abstract direction

### 7. contrast-clutter-risk
Will the background maintain enough contrast headroom for text overlay?
- **1**: Prompt describes high-contrast, busy, or multi-colored scenes
- **3**: Moderate complexity; may need compositor adjustments
- **5**: Explicitly low-noise, controlled palette, clear contrast hierarchy

### 8. nano-banana2-friendliness
Is the prompt well-suited to the Nano Banana2 (Gemini image) model's strengths?
- **1**: Uses terms/styles the model handles poorly (complex 3D, photorealistic faces)
- **3**: Neutral - standard prompt that should work adequately
- **5**: Leverages known model strengths (abstract gradients, geometric patterns, atmospheric effects)

## Thresholds

| Average Score | Action |
|--------------|--------|
| >= 4.0 | Proceed to generation |
| 3.0 - 3.9 | Proceed with warning logged |
| < 3.0 | Trigger LLM repair before generation |

## Aggregate Reporting

The critique summary in `background-prompt-trace.json` includes:
- Per-dimension scores
- Average score
- Weakest dimension (for targeted improvement)
- Whether repair was triggered
