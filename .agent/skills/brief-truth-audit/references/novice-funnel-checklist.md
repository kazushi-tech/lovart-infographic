# Novice Funnel Checklist

## Primary Flow

1. テーマ入力 (theme input)
2. 目的選択 (intent selection)
3. (optional advanced settings -- collapsed by default)
4. 生成 (generate)

## Mode Tab Rules

- Default to guided mode, not a 3-tab selector shown prominently
- Novice should land directly in the guided flow without choosing a mode
- Custom mode is a secondary path, not a primary tab

## Style Resolution

- Style should auto-resolve from intent by default
- Novice users should not be required to pick a visual style manually
- Style override is available in the advanced (collapsed) section

## ExpectedOutputSummary

- Must be visible before the Generate button
- Shows what the user will receive based on their selections
- Prevents surprise about output format or content

## Mandatory Questions

- Maximum 2 mandatory questions in the primary flow
- Intent is always mandatory
- Count (slide count) is optional or has a sensible default
- All other parameters belong in the advanced (collapsed) section

## Export for Novice

- Primary: PDF and ZIP
- HTML exports are advanced-only
- Do not surface HTMLプレビュー (別タブ遷移) to novice users

## お任せ (Omakase) Positioning

- "お任せ" becomes a "quick start" button within the guided flow
- It is NOT a separate tab
- It auto-selects recommended intent and generates immediately
