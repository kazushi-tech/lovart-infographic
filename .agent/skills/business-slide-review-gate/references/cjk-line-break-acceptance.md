# CJK Line-Break Acceptance Criteria

## Character Sets

`CJK_NO_LINE_START` and `CJK_NO_LINE_END` are defined in `slide-compositor.ts`.

### CJK_NO_LINE_START

Characters that must not appear at the beginning of a line:

    。、，．！？）」』】〉》〕｝～ー…‥・

### CJK_NO_LINE_END

Characters that must not appear at the end of a line:

    （「『【〈《〔｛

## Rules

1. If the next character is in `CJK_NO_LINE_START`, do not break before it. Carry the current character to the next line together with it.
2. If the current character is in `CJK_NO_LINE_END`, do not break after it. The opening bracket must stay with the following character.

## Acceptance Criteria

- No orphaned closing punctuation at line start (e.g., 。 or ） appearing as the first character of a line)
- No orphaned opening brackets at line end (e.g., 「 or （ appearing as the last character of a line)
- Line breaks between regular CJK characters are acceptable at any position

## Known Gap

- Word-level break for mixed Latin + CJK text is not yet implemented
- Latin words within CJK text may be split mid-word at line boundaries
- Future improvement: detect Latin word boundaries within CJK-dominant text
