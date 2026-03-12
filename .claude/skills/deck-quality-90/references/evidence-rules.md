# Evidence Rules - 2026-03-08

## What Counts as Defensible Evidence

### Tier 1: Confirmed Facts (最高信頼度)

Directly measurable, reproducible, and verified through automated checks.

| Evidence Type | Verification | Example |
|--------------|-------------|-----------|
| `npm test` results | Automated test output | `363/363 pass` |
| `npm run build` results | Build process output | `Build successful` |
| `npx tsc --noEmit` results | Type checking output | `No type errors` |
| Git commit hash | Version control | `5e2da9d` |
| Code changes committed | Git diff | `6 files changed, 581 insertions` |

**Acceptable Claims**: "Tests pass", "Build succeeds", "No type errors"

**Unacceptable Claims**: "Quality is good", "No bugs", "Production ready"

### Tier 2: Renderer-Level Evidence (高信頼度)

SVG output-based review with realistic SlideSpec, programmatic measurement.

**Criteria**:
- Uses `buildOverlaySvgForTest()` or equivalent renderer
- Realistic SlideSpec inputs (not synthetic)
- Programmatic metric extraction (bbox, spacing, collision)
- Human rubric scoring

**Acceptable Claims**: "Renderer-level review shows X improvement", "SVG analysis confirms Y"

**Unacceptable Claims**: "Deck quality is X", "Output looks good"

**Limitation**: Does NOT include:
- Real background images
- HTML/PDF final output
- End-to-end production behavior

### Tier 3: Actual Measurement (中〜高信頼度)

Direct measurement of real artifacts (full deck with background images).

**Criteria for Full-Deck Review**:
- Pipeline progress = 100%
- Expected slide count reached (typically 3 per theme)
- Acceptance signal visible in UI
- Screenshots captured per slide
- Background validation metrics captured

**Smoke Test (NOT Full-Deck)**:
- `slideCount > 0` alone
- Partial generation (1/3 slides)
- Pipeline not fully completed
- Acceptance signal not displayed

**Acceptable Claims for Full-Deck**: "Full-deck review with real backgrounds shows X", "Actual measurement confirms Y"

**Unacceptable Claims**: "Background is clean because counter=0", "Visual quality is good"

### Tier 4: Estimates Based on Measurement (低信頼度)

Reasoned estimates derived from measured facts, but NOT directly measured.

**Examples**:
- Background cleanliness: "19 points (estimated from 0/0/0 metrics)"
- Overall score: "85.4 = Phase1 (84.1) + Phase2 correction (+2.0)"

**Acceptable Claims**: "Estimated score based on actual measurement is X", "Expected to achieve Y"

**Unacceptable Claims**: "Score is X", "Achieved Y points"

## Prohibited Evidence Patterns

### 1. Counter-Based Visual Quality Claims

**Prohibited**:
- "Background is clean because bgWhiteFallback=0, bgTextDetected=0, composeWarnings=0"
- "No visual defects detected" (without rubric scoring)

**Required**:
- Rubric-based visual scoring (18-20 point scale)
- Screenshot review by human or explicit criteria
- "Based on counter metrics: 19 points (estimated)"

### 2. Partial Generation as Full-Deck

**Prohibited**:
- "Full-deck review complete" when only 1/3 slides generated
- "Theme review complete" with partial pipeline output
- "All themes tested" with incomplete artifacts

**Required**:
- Explicit statement of actual vs expected slide counts
- "Partial review: 1/3 slides generated"
- "Full-deck review pending complete generation"

### 3. Smoke Test as Quality Evidence

**Prohibited**:
- "Phase 2 complete" with `slideCount > 0` condition
- "Quality verified" without rubric scoring
- "Background confirmed clean" without visual review

**Required**:
- Distinguish between smoke test and full-deck review
- "Smoke test: counters clean"
- "Full-deck review: rubric score 19/20"

### 4. Renderer-Level as End-to-End

**Prohibited**:
- "End-to-end review shows X" (when only SVG renderer tested)
- "Production behavior confirmed" (without actual production verification)
- "Full deck quality is Y" (without real backgrounds)

**Required**:
- "Renderer-level review (no real backgrounds)"
- "End-to-end pending production verification"
- "Full deck quality estimate: X (background TBD)"

## Evidence Tier Mapping to Claims

| Claim Type | Minimum Evidence Tier | Required Caveats |
|------------|----------------------|------------------|
| "Tests pass" | Tier 1 | None |
| "Build succeeds" | Tier 1 | None |
| "SVG review shows improvement" | Tier 2 | Must specify renderer-level |
| "Full-deck review complete" | Tier 3 | Must verify 100% pipeline + expected slides |
| "Background cleanliness: 19" | Tier 4 | Must say "estimated from metrics" or "rubric scored" |
| "Overall score: 85.4" | Tier 4 | Must show calculation from measured components |

## When to Claim "Verified"

**Use "Verified" only for**:
- Direct measurements (Tier 1, 2, 3)
- Test pass/fail outcomes
- Code changes in repository

**Use "Estimated" or "Provisional" for**:
- Overall scores combining multiple tiers
- Background cleanliness from counter metrics
- Predictions of future improvements

## Documentation Requirements

### For Full-Deck Review Documents

Must include:
1. Theme list with QA answers
2. Actual slide counts vs expected
3. Pipeline progress percentage
4. Acceptance signal status (visible? value?)
5. Background metrics (counters + rubric score)
6. Screenshots per slide
7. Any available HTML/PDF/ZIP artifacts

### For Defect Claims

Must include:
1. pageKind (cover, comparison, roadmap, etc.)
2. severity (critical, major, minor)
3. scope (systemic, theme-specific)
4. category (layout, background, copy-fit, hierarchy, footer)
5. reproducer (always, frequent, rare)
6. Expected score delta

### For Score Claims

Must include:
1. Rubric breakdown (5 categories × 20 points)
2. Scoring methodology (human, rubric, automated)
3. Evidence tier (measured vs estimated)
4. Calculation from components (Phase 1 + Phase 2 = Total)

---

*Generated: 2026-03-08*
