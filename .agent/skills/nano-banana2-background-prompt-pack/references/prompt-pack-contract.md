# Prompt Pack Contract

## Directory Structure

```
prompts/backgrounds/nano-banana2/
  VERSION.json                     - Pack version metadata
  master-system.md                 - Art director system prompt
  shared-constraints.md            - No-text, safe zone, noise rules
  anti-patterns.md                 - Visual anti-patterns to avoid
  negative-prompts.md              - Nano Banana2 negative prompt terms
  repair-rubric.md                 - 8-dimension evaluation rubric
  page-kinds/                      - Per-pageKind art direction
    cover.md
    executive-summary.md
    problem-analysis.md
    comparison.md
    roadmap.md
    deep-dive.md
    decision-cta.md
  style-families/                  - Visual style presets
    conservative-ir.md
    consulting-editorial.md
    operational-blueprint.md
  motifs/                          - Reusable visual motif libraries
    supply-chain.md
    data-flow.md
    commerce-growth.md
    platform-modularity.md
  few-shots/                       - Example prompts for reference
    cover-conservative-ir.md
```

## VERSION.json Schema

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-03-10",
  "description": "Initial background prompt pack for Nano Banana2"
}
```

## Versioning Rules

1. **Git-based**: All prompt assets are version-controlled in the repo
2. **Semantic versioning** (`MAJOR.MINOR.PATCH`):
   - **MAJOR**: Breaking changes to prompt structure or VisualBrief contract
   - **MINOR**: New page-kinds, style-families, or motifs added
   - **PATCH**: Wording refinements, typo fixes, rubric adjustments
3. **Commit prefix**: Use `prompt: ` for all background prompt changes
4. **VERSION.json**: Must be updated on every MINOR or MAJOR bump
5. **Backward compatibility**: PATCH and MINOR changes must not break existing prompt assembly

## Required Files (Minimum Viable Pack)

The following files are required for the pack to be considered complete:

- `VERSION.json`
- `master-system.md`
- `shared-constraints.md`
- All 7 page-kind files in `page-kinds/`
- All 3 style-family files in `style-families/`
- At least 1 file in `motifs/`
- At least 1 file in `few-shots/`

## File Conventions

- All `.md` files use standard Markdown
- No frontmatter required (plain prose for LLM consumption)
- Each file should be self-contained enough for the LLM to use in isolation
- Keep individual files under 2000 tokens for efficient prompt assembly
