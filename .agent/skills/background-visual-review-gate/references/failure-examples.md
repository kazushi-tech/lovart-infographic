# Common Failure Patterns

## Overview

Documented failure patterns observed in background image generation. Use these as negative examples when reviewing prompts and generated images.

---

## 1. Generic Gradient Blob

**Symptom**: Background is a smooth gradient with no meaningful visual content. Could belong to any presentation on any topic.

**Root Cause**: Prompt lacks motif specificity; falls back to safe but meaningless gradient.

**Critique Signals**: Low `motif-specificity` (1-2), high `generic-wallpaper-smell` (1-2).

**Fix**: Inject domain-specific motifs from the motif library. Ensure VisualBrief.allowedMotifs is populated.

---

## 2. Pseudo-Text Artifacts

**Symptom**: Generated image contains text-like marks, fake numbers, blurred words, or UI-like labels. Common with prompts mentioning "dashboard", "report", "data display".

**Root Cause**: Prompt uses terms that Nano Banana2 interprets as text-containing scenes.

**Critique Signals**: High `text-artifact-risk` (1-2).

**Fix**: Add explicit negative prompt terms ("no text, no numbers, no labels, no UI elements"). Avoid trigger words in positive prompt. Use `negative-prompts.md` terms.

---

## 3. Safe Zone Contamination

**Symptom**: High-detail visual elements (edges, patterns, focal points) placed exactly where text will be composited, making text unreadable.

**Root Cause**: Prompt does not specify spatial layout or safe zone avoidance.

**Critique Signals**: Low `safe-zone-discipline` (1-2). Post-generation validator flags high edge density in safe zone.

**Fix**: Add explicit spatial direction ("visual weight concentrated in [specific region], leaving [safe zone region] clear and subdued").

---

## 4. Dark Background with Low Text Contrast

**Symptom**: Overall dark or heavily saturated background that makes overlaid text (especially dark text) illegible.

**Root Cause**: Prompt describes "dramatic", "deep", "rich" scenes without constraining brightness range.

**Critique Signals**: High `contrast-clutter-risk` (1-2).

**Fix**: Specify brightness constraints ("light to mid-tone background", "pastel palette"). Ensure contrastBudget in VisualBrief is respected.

---

## 5. Multiple Competing Motifs

**Symptom**: Background contains 3+ distinct visual metaphors fighting for attention. Looks busy and unfocused.

**Root Cause**: Too many motifs in allowedMotifs, or prompt concatenates multiple motif descriptions without hierarchy.

**Critique Signals**: High `contrast-clutter-risk` (1-2), moderate `generic-wallpaper-smell`.

**Fix**: Limit to 1-2 motifs per page. Establish primary/secondary hierarchy in prompt. Use forbiddenMotifs to exclude extras.

---

## 6. Fake Dashboard/UI Elements

**Symptom**: Background contains rendered chart outlines, fake buttons, window chrome, or grid layouts that look like a screenshot of software.

**Root Cause**: Prompt mentions "analytics", "platform", "interface" which Nano Banana2 renders literally.

**Critique Signals**: High `text-artifact-risk` (1-2), low `nano-banana2-friendliness` (1-2).

**Fix**: Use abstract metaphors instead of literal UI terms. Replace "analytics dashboard" with "flowing data streams". Add "no UI elements, no charts, no windows" to negative prompts.

---

## Prevention Checklist

When reviewing a background prompt, verify:
- [ ] No literal UI/dashboard terms in positive prompt
- [ ] Negative prompt includes standard anti-text terms
- [ ] Safe zone spatial direction is explicit
- [ ] At most 2 motifs referenced
- [ ] Brightness/contrast constraints are specified
- [ ] Domain-specific motif is present (not just generic abstract)
