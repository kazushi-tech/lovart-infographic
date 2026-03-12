# Native vs Image PPTX

## Image-in-PPTX

Embed generated JPEG slides as full-page images inside a .pptx container.

- Feasible with pptxgenjs (~20KB dependency)
- NOT editable -- slides are images, not native PowerPoint objects
- User cannot edit text, charts, or layout within PowerPoint
- MUST NOT be called "editable PowerPoint"
- Acceptable label: "PowerPoint形式（画像版）"

### Advantages

- Simple implementation: one image per slide
- Preserves exact visual fidelity from the compositor
- Compatible with all PowerPoint versions

### Limitations

- No text selection or editing
- No accessibility (screen readers cannot read image text)
- Large file size (embedded JPEG images)
- Projector scaling may degrade quality

## Native Editable PPTX

Text boxes, shapes, charts as native PowerPoint objects.

### Requirements

- Map SlideSpec fields to pptx text boxes and positioned shapes
- Headline, facts, KPIs, comparison rows, roadmap phases all need native representation
- Font rendering differs from SVG compositor (Sharp/SVG vs PowerPoint internal renderer)
- CJK line-break rules would need reimplementation in the pptx domain

### Complexity: HIGH

- SlideSpec includes: headline, facts, KPIs, comparison tables, roadmap timelines, source notes
- Each slide type has different layout logic
- Color themes, gradients, and decorative elements need PowerPoint equivalents
- Testing matrix: PowerPoint for Windows, Mac, Google Slides, LibreOffice Impress

### Current Verdict: INFEASIBLE in short term

- Full SlideSpec mapping is a major engineering effort
- CJK line-break parity alone is a non-trivial sub-project
- Minimum viable subset: cover slide + text-only slides (no comparison tables, no roadmap timelines)
- Even the minimum viable subset requires significant effort for acceptable quality
