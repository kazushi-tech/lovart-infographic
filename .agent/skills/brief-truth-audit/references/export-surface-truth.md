# Export Surface Truth

## Current Export Surface

| Route | Format | Description |
|-------|--------|-------------|
| HTML閲覧版 | Standalone HTML | Downloads whitepaper HTML with embedded base64 images |
| HTMLプレビュー | Browser tab | Opens new tab via `window.open` -- cognitive cost for novice users |
| PDF | Image-per-page landscape | Each slide rendered as full-page image |
| ZIP (JPEG) | Archive of JPEG slides | Individual slide images bundled |

## PPTX Status

- No pptx route or dependency exists in the project
- No pptxgenjs or equivalent in package.json
- Do not claim pptx capability

## Novice-Primary Exports

PDF and ZIP only. These are the two exports surfaced to novice users.

- PDF: familiar format, opens in any viewer, printable
- ZIP: individual slide images for reuse

## Advanced / Operator Exports

HTML exports are for advanced or operator use only.

- HTML閲覧版: standalone download, useful for web embedding
- HTMLプレビュー: opens separate browser tab, high cognitive cost for novice users -- not recommended as primary export

## Key Constraints

- HTMLプレビュー uses `window.open` which is disorienting for novice users
- PDF is image-based, not editable text
- ZIP contains JPEG files, not vector
- No editable PowerPoint output exists
