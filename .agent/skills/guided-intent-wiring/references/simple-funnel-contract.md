# Simple Funnel Contract (Novice)

## Entry Point

Theme input -- already exists in the parent component. User types or pastes a topic.

## Step 1: Intent Selection

- 5 intent cards displayed
- One card pre-selected as "recommended" based on theme analysis
- Single click to select; selection is visually highlighted
- No scrolling required -- all 5 cards visible at once

## Step 2: Generate Button

- Style is auto-resolved from the selected intent
- No manual style selection required
- Generate button is prominent and clearly labeled
- ExpectedOutputSummary is visible between Step 1 and Generate

## Advanced Section (Collapsed by Default)

Available overrides for power users, hidden behind a collapsible panel:

- Style override (override auto-resolved style)
- Audience
- Tone
- Detail level
- Slide count
- Supplement material

## No Mode Tabs for Novice

- Novice users see the guided flow directly
- No tab bar showing "guided / custom / お任せ"
- Mode switching is available but not prominently displayed

## お任せ (Quick Start)

- Positioned as a "quick start" button within the guided flow
- NOT a separate tab
- Behavior: auto-selects recommended intent, auto-resolves style, proceeds to generate
- Equivalent to accepting all defaults and clicking Generate

## ExpectedOutputSummary

Displayed between intent selection and the Generate button. Shows:

- Selected intent label
- Auto-resolved style
- Expected slide count
- Export formats available (PDF, ZIP)
