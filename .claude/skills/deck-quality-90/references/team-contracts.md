# Team Contracts - 2026-03-08

## Overview

This document defines roles and contracts for agent teams executing the deck-quality-90 workflow.

## Team A: Evidence Guard Team

### Role
Review existing claims and enforce evidence rules. Distinguish between facts, measurements, and estimates.

### Responsibilities
1. Review Phase 2 / summary / release note claims
2. Identify smoke test vs full-deck review
3. Enforce "言ってよいこと / 言ってはいけないこと"
4. Validate evidence tier classification

### Contract
- **DO**: Challenge any claim lacking appropriate evidence tier
- **DO**: Reject optimistic claims as "verified"
- **DO**: Mark estimates as "provisional"
- **DON'T**: Allow "background clean" from counter=0 alone
- **DON'T**: Accept partial generation as "full-deck review"
- **DON'T**: Approve renderer-level as "end-to-end"

### Deliverables
- Evidence review findings markdown
- Claim validation list (approved/rejected with reasons)
- Required caveats for all approved claims

## Team B: Strict Phase 2b E2E Review Team

### Role
Execute full-deck review with strict completion gates. Generate artifacts for defect analysis.

### Responsibilities
1. Execute CDP/browser automation for 3+ themes
2. Enforce strict completion gates (not smoke test conditions)
3. Capture artifacts: screenshots, HTML/PDF/ZIP, metadata
4. Score background cleanliness with rubric (not just counters)
5. Document actual vs expected slide counts

### Contract
- **DO**: Verify pipeline = 100% before declaring complete
- **DO**: Verify expected slide count reached (typically 3)
- **DO**: Verify acceptance signal visible in UI
- **DO**: Capture screenshot per slide
- **DO**: Score background with visual rubric
- **DON'T**: Declare complete with `slideCount > 0` alone
- **DON'T**: Assume visual quality from counter metrics alone
- **DON'T**: Call smoke test "full-deck review"

### Success Conditions (ALL must be true)
1. Pipeline progress = 100%
2. Expected slide count reached
3. Acceptance signal visible in UI
4. Screenshots saved per slide
5. Background validation metrics captured

### Deliverables
- Strict Phase 2b review markdown
- Full-deck artifacts (3+ themes)
- Background rubric scores (not just counters)
- Actual vs expected slide count table

## Team C: Layout Polish Team

### Role
Identify and fix top 3-4 systemic defects. Focus on layout/readability/business presentability.

### Responsibilities
1. Review artifacts from Phase 2b with rubric
2. Extract top 3-4 defects with taxonomy
3. Implement focused fixes (no scope creep)
4. Add regression tests per fix
5. Target pageKinds: comparison, roadmap, cover, executive-summary

### Contract
- **DO**: Fix ONLY top 3-4 defects
- **DO**: Attach 1+ regression test per fix
- **DO**: Focus on layout/readability/business (background already good)
- **DO**: Target systemic defects (multiple themes)
- **DON'T**: Fix everything found
- **DON'T**: Implement speculative fixes without evidence
- **DON'T**: Add aesthetic-only changes without score delta

### Common Fix Categories
- **comparison**: row budget, text wrap, row count fallback, footer reserve
- **roadmap**: phase spacing, bullet budget, footer reserve, bullet hierarchy
- **cover**: KPI hierarchy, subheadline spacing, hero KPI presence
- **executive-summary**: facts/KPI/footer rhythm, breathing room
- **decision-cta**: CTA weight, source clarity, actions→CTA gap

### Deliverables
- Top 3-4 defects with taxonomy
- Focused fix implementation
- Regression tests
- Fix descriptions mapping to defect taxonomy

## Team D: Release Gate Team

### Role
Validate actual achievement and create defensible release note. No optimistic claims.

### Responsibilities
1. Re-run same 3+ themes after fixes
2. Score before/after with same rubric
3. Run quality gates (`npm test`, `npm run build`, `npx tsc --noEmit`)
4. Apply 90-point gate criteria
5. Create defensible release note OR gap-to-90 report

### Contract
- **DO**: Report actual measured scores
- **DO**: Differentiate measured vs estimated components
- **DO**: Apply evidence tier classification
- **DO**: Create gap-to-90 report if 90 not achieved
- **DON'T**: Claim 90 without actual measurement
- **DON'T**: Write optimistic summary when 90 not achieved
- **DON'T**: Hide gap-to-90 in prose

### 90-Point Gate Criteria

| Criteria | Target | Required for "90" Claim |
|----------|--------|------------------------|
| Average score | >= 90 | YES |
| No deck < 86 | true | YES |
| No slide < 82 | true | YES |
| Critical defects | 0 | YES |
| Background cleanliness | 18+ | YES |
| Acceptance signal mismatch | not severe | YES |

### Failure Protocol
If 90 gate not met:
1. Document actual score achieved
2. Quantify gap to 90
3. Identify top 3 blockers
4. Create gap-to-90 report (NOT optimistic summary)

### Deliverables
- Before/after scoring table
- 90 gate pass/fail decision
- Either: defensible release note (if 90+) OR gap-to-90 report (if <90)

## Coordination Rules

### Handoff Points
1. **Evidence Guard → Phase 2b Review Team**: Validated CDP script with strict gates
2. **Phase 2b Review Team → Layout Polish Team**: Full-deck artifacts with rubric scores
3. **Layout Polish Team → Release Gate Team**: Fixed code with regression tests
4. **Release Gate Team → All**: Final decision (90+ OR gap-to-90)

### Communication Protocol
- Each team produces markdown artifacts
- Artifacts are team-specific and reproducible
- No team modifies previous team's artifacts (only references)
- Clear handoff criteria documented

### Escalation
- If Phase 2b cannot generate full decks: Document blocker, proceed with available artifacts
- If defects exceed 3-4: Prioritize by impact, document remaining
- If 90 not achieved: Create gap-to-90 report with next steps

---

*Generated: 2026-03-08*
