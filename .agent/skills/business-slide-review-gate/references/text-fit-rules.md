# Text Fit Rules

## Cover Headline

- Max 20 CJK characters per line at fontSize 72+
- Multi-line headlines must respect this per-line limit

## CJK Line-Break Prohibited Characters

No-line-start (must not appear at the beginning of a line):

    。、，．！？）」』】〉》〕｝～ー…‥・

No-line-end (must not appear at the end of a line):

    （「『【〈《〔｛

## KPI Values

- Value + unit: keep as a single visual unit
- Use thin-space separator between value and unit
- Overflow warning: if combined value+unit exceeds 20 characters
- Fusion warning: if value field contains mixed digits + text without a separate unit field

## Fact Bullets

- Max 60 characters for CJK-heavy lines (>60% CJK content)
- Lines exceeding this limit risk overflow or truncation in the compositor

## Source Note

- Max 2 lines at fontSize 20
- Longer source attributions must be truncated or abbreviated

## Summary / Comparison Slots

- Slot budget = available height / (line count x line height)
- Each text block must fit within its allocated slot

## Warning vs Clamp Boundary

- Warning threshold: >80% of slot budget consumed
- Force truncate threshold: 100% of slot budget
- Between 80-100%: emit presentability warning but do not truncate
- At 100%: force truncate with ellipsis to prevent visual overflow
