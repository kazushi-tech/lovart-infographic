# Benchmark Matrix

## Overview

A minimal but systematic test matrix for evaluating background image prompt quality across representative combinations.

## Dimensions

### Themes (3)
| ID | Theme | Domain |
|----|-------|--------|
| T1 | ERP刷新 | Enterprise IT / Operations |
| T2 | AI営業改革 | Sales / AI Transformation |
| T3 | ESGトランジション | Sustainability / Finance |

### PageKinds (4 representative)
| ID | PageKind | Visual Role |
|----|----------|-------------|
| P1 | cover | hero-impact |
| P2 | comparison | structured-compare |
| P3 | roadmap | forward-flow |
| P4 | decision-cta | action-anchor |

### Style Families (2)
| ID | Style | Character |
|----|-------|-----------|
| S1 | conservative-ir | Formal, muted, investor-grade |
| S2 | consulting-editorial | Modern, clean, McKinsey-like |

## Full Matrix (24 combinations)

| # | Theme | PageKind | Style | Expected Motifs |
|---|-------|----------|-------|-----------------|
| 1 | T1 ERP刷新 | P1 cover | S1 conservative-ir | supply-chain, platform-modularity |
| 2 | T1 ERP刷新 | P1 cover | S2 consulting-editorial | supply-chain, platform-modularity |
| 3 | T1 ERP刷新 | P2 comparison | S1 conservative-ir | platform-modularity |
| 4 | T1 ERP刷新 | P2 comparison | S2 consulting-editorial | platform-modularity |
| 5 | T1 ERP刷新 | P3 roadmap | S1 conservative-ir | supply-chain |
| 6 | T1 ERP刷新 | P3 roadmap | S2 consulting-editorial | supply-chain |
| 7 | T1 ERP刷新 | P4 decision-cta | S1 conservative-ir | platform-modularity |
| 8 | T1 ERP刷新 | P4 decision-cta | S2 consulting-editorial | platform-modularity |
| 9 | T2 AI営業改革 | P1 cover | S1 conservative-ir | data-flow |
| 10 | T2 AI営業改革 | P1 cover | S2 consulting-editorial | data-flow |
| 11 | T2 AI営業改革 | P2 comparison | S1 conservative-ir | data-flow |
| 12 | T2 AI営業改革 | P2 comparison | S2 consulting-editorial | data-flow |
| 13 | T2 AI営業改革 | P3 roadmap | S1 conservative-ir | data-flow, commerce-growth |
| 14 | T2 AI営業改革 | P3 roadmap | S2 consulting-editorial | data-flow, commerce-growth |
| 15 | T2 AI営業改革 | P4 decision-cta | S1 conservative-ir | commerce-growth |
| 16 | T2 AI営業改革 | P4 decision-cta | S2 consulting-editorial | commerce-growth |
| 17 | T3 ESGトランジション | P1 cover | S1 conservative-ir | commerce-growth |
| 18 | T3 ESGトランジション | P1 cover | S2 consulting-editorial | commerce-growth |
| 19 | T3 ESGトランジション | P2 comparison | S1 conservative-ir | commerce-growth |
| 20 | T3 ESGトランジション | P2 comparison | S2 consulting-editorial | commerce-growth |
| 21 | T3 ESGトランジション | P3 roadmap | S1 conservative-ir | commerce-growth |
| 22 | T3 ESGトランジション | P3 roadmap | S2 consulting-editorial | commerce-growth |
| 23 | T3 ESGトランジション | P4 decision-cta | S1 conservative-ir | commerce-growth |
| 24 | T3 ESGトランジション | P4 decision-cta | S2 consulting-editorial | commerce-growth |

## Testing Protocol

### Level 1: Spot Check (fast, during development)
- Pick 1 row from the matrix
- Generate background, inspect visually
- Check critique scores in trace

### Level 2: Representative Check (pre-commit)
- Pick 1 theme, run all 8 combinations (4 pageKinds x 2 styles)
- Verify no critique dimension drops below 2.0
- Verify no safe zone violations in generated images

### Level 3: Full Matrix (pre-release)
- Run all 24 combinations
- Generate aggregate statistics
- Flag any combination with average critique < 3.5
