---
name: deck-quality-90
description: Workflow for achieving 90+ deck quality score through strict evidence-based review, defect harvesting, and focused polish. Use this skill when improving infographic deck quality from 80-85 to 90+ range, or when preparing for submission-ready quality gates.
---

# Deck Quality 90

## Purpose

This skill provides a structured workflow to elevate infographic deck quality from the 80-85 range to 90+ through:

- Strict full-deck evidence gathering (not smoke tests)
- Evidence-based defect harvesting (not speculative fixes)
- Focused polish on top 3-4 systemic defects
- Rubric-based before/after scoring with defensible claims

## When to Use

Use this skill when:

- Target average score is 90+ (currently at 85.4 provisional)
- Need strict full-deck review with actual background images
- Required to identify and fix top 3-4 systemic defects
- Must provide defensible evidence for quality claims
- Preparing for submission-ready gate with rigorous validation

## Workflow Overview

Execute phases sequentially. Each phase produces specific artifacts that feed into the next.

**Phase 0: Re-Baseline** → Document current state as provisional estimate
**Phase 1: Skill Bootstrap** → This skill (complete)
**Phase 2: Strict Phase 2b** → Full-deck E2E review with strict completion gates
**Phase 3: 90-Point Defect Harvest** → Extract top defects from actual artifacts
**Phase 4: Focused Polish Sprint** → Fix top 3-4 defects with regression tests
**Phase 5: Re-Review and 90 Gate** → Validate 90+ achievement or document gap

## Phase 0: Re-Baseline

Establish current state as **provisional estimate**, not verified 90.

### Read Current State
- `plans/phase0-rebaseline-2026-03-08.md` - Current baseline
- Current score: 85.4 (provisional estimate)
- Gap to 90: 4.6 points across layout/readability/business categories

### Identify Weaknesses
- Phase 2 CDP script uses weak success condition: `slideCount > 0 || hasDownload`
- Full deck completion not verified (Theme 1/3 only 1 slide, expected 3)
- Acceptance signal not displayed in UI (hasAcceptanceSignal: false)
- Background metrics (0/0/0) don't guarantee visual quality

### DoD
- Current state documented as provisional estimate
- 90-point gap identified by rubric category

## Phase 2: Strict Phase 2b

Replace smoke test with strict full-deck E2E review.

### Update CDP Script
Modify `verify_output/cdp_background_review.mjs` or create `scripts/run-strict-phase2b-check.mjs`:

**Success Conditions** (ALL must be true):
1. Pipeline progress = 100%
2. Expected slide count reached (typically 3 per theme)
3. Acceptance signal visible in UI (`共有可`/`要確認`/`高リスク`)
4. Screenshots saved per slide
5. Background validation metrics captured

**Forbidden Conditions**:
- NEVER declare complete with `slideCount > 0` alone
- NEVER assume visual quality from counter metrics alone
- NEVER call smoke test "full-deck review"

### Execute Review
- Run 3+ themes with strict gates
- Save artifacts: screenshots, HTML/PDF/ZIP if available, bg validation metadata
- Score background cleanliness with 20-point rubric (not just counters)
- Document actual vs expected slide counts

### DoD
- Strict Phase 2b review markdown with full-deck artifacts
- All 3+ themes meeting strict completion gates
- Background cleanliness scored with rubric

## Phase 3: 90-Point Defect Harvest

Extract top defects from actual artifacts, not speculation.

### Score Current Artifacts
- Apply rubric per deck (100-point total, 20 per category)
- Score per slide (target: no slide < 82)
- Break down by pageKind category

### Rubric Categories (20 points each)
1. **Background cleanliness** (18-20: excellent, 15-17: good, 0-14: fix needed)
2. **Layout safety** (spacing, collision, overflow)
3. **Readability and hierarchy** (font sizing, information density, contrast)
4. **KPI/source integrity** (data accuracy, source attribution)
5. **Business presentability** (professional polish, CTA clarity)

### Defect Taxonomy
Tag each defect with:
- `pageKind`: cover, executive-summary, comparison, roadmap, decision-cta, etc.
- `severity`: critical (block submit), major (visible quality drop), minor (polish)
- `scope`: systemic (multiple themes) vs theme-specific
- `category`: layout, background, copy-fit, hierarchy, footer, data-contract
- `reproducibility`: always, frequent, rare

### Rank Top 3-4 Defects
Select by:
1. Priority: critical > systemic major > isolated major > minor
2. Impact: affects multiple pageKinds or themes
3. Expected score delta: quantified improvement estimate

### DoD
- 90-point defect ranking markdown
- Each defect tagged with taxonomy
- Expected score delta specified

## Phase 4: Focused Polish Sprint

Fix ONLY top 3-4 defects, not everything.

### Implementation Rules
1. One defect = one focused fix (no scope creep)
2. Attach 1+ regression test per fix
3. Target pageKinds: comparison, roadmap, cover, executive-summary (primary)
4. Focus on: layout, readability, business presentability (background already good)

### Common Fix Categories
- **comparison**: row budget, text wrap, row count fallback, footer reserve
- **roadmap**: phase spacing, bullet budget, footer reserve, bullet hierarchy
- **cover**: KPI hierarchy, subheadline spacing, hero KPI presence
- **executive-summary**: facts/KPI/footer rhythm, breathing room
- **decision-cta**: CTA weight, source clarity, actions→CTA gap

### Testing
- Write regression test per fix
- Verify fix with multiple themes
- Ensure no regression in previously working areas

### DoD
- Top 3-4 fixes committed
- Regression tests added
- Fix descriptions map to defect taxonomy

## Phase 5: Re-Review and 90 Gate

Validate actual achievement, not optimistic claims.

### Execute Re-Run
- Same 3+ themes as Phase 2b
- Same rubric scoring
- Capture before/after comparison

### Quality Gates
Verify all pass:
- `npm test` → pass
- `npm run build` → pass
- `npx tsc --noEmit` → pass

### 90 Gate Criteria

| Criteria | Target | Result |
|----------|--------|--------|
| Average score | >= 90 | ? |
| No deck < 86 | true | ? |
| No slide < 82 | true | ? |
| Critical defects | 0 | ? |
| Background cleanliness | 18+ | ? |
| Acceptance signal mismatch | not severe | ? |

### Failure Protocol
If 90 gate not met:
1. Document actual score achieved
2. Quantify gap to 90
3. Identify top 3 blockers
4. Create gap-to-90 report (NOT optimistic summary)

### DoD
- Before/after scoring table
- 90 gate pass/fail decision
- Either: defensible release note (if 90+) OR gap-to-90 report (if <90)

## Execution Principles

1. **Never claim verified 90 on provisional estimate**
2. **Never accept smoke test as full-deck review**
3. **Never mix measured facts with estimates in claims**
4. **Never declare complete without full artifacts**
5. **Never fix without evidence + regression test**
6. **Never write optimistic summary when 90 not achieved**

## Resources

### references/

Load these as needed for detailed specifications:

- `references/current-state.md` - Baseline state and provisional estimates
- `references/evidence-rules.md` - What counts as defensible evidence
- `references/rubric-90.md` - Detailed 90-point rubric breakdown
- `references/team-contracts.md` - Team role definitions (if using agent teams)

### scripts/

Executable automation:

- `scripts/run-strict-phase2b-check.mjs` - Strict full-deck review script

Run scripts directly for reliability. Read only when patching or environment-specific adjustments needed.

### assets/

(Not currently used for this skill)

---

**Success Metric**: Actual 90+ average achieved with defensible evidence, NOT optimistic summary.
